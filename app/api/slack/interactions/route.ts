import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  openCommentModal,
  updateListItemComment,
  updateMessage,
} from "@/lib/slack";

function verifySlackSignature(
  signingSecret: string,
  requestBody: string,
  timestamp: string,
  signature: string
): boolean {
  const sigBasestring = `v0:${timestamp}:${requestBody}`;
  const mySignature =
    "v0=" +
    crypto
      .createHmac("sha256", signingSecret)
      .update(sigBasestring, "utf8")
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(mySignature, "utf8"),
    Buffer.from(signature, "utf8")
  );
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signingSecret = process.env.SLACK_SIGNING_SECRET;

    // Verify signature if signing secret is available
    if (signingSecret) {
      const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";
      const slackSignature =
        request.headers.get("x-slack-signature") ?? "";

      // Prevent replay attacks (5 minute window)
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - Number(timestamp)) > 60 * 5) {
        return NextResponse.json(
          { error: "Request too old" },
          { status: 403 }
        );
      }

      if (!verifySlackSignature(signingSecret, rawBody, timestamp, slackSignature)) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 403 }
        );
      }
    }

    // Parse the payload (Slack sends as application/x-www-form-urlencoded)
    const params = new URLSearchParams(rawBody);
    const payloadString = params.get("payload");
    if (!payloadString) {
      return NextResponse.json(
        { error: "No payload found" },
        { status: 400 }
      );
    }

    const payload = JSON.parse(payloadString);
    const { type } = payload;

    // ─── Block Actions (button clicks) ──────────────────────
    if (type === "block_actions") {
      const action = payload.actions?.[0];
      if (!action) {
        return NextResponse.json({ ok: true });
      }

      const actionId = action.action_id;
      const listItemId = action.value;
      const channel = payload.channel?.id ?? payload.container?.channel_id;
      const messageTs = payload.message?.ts ?? payload.container?.message_ts;
      const triggerId = payload.trigger_id;

      if (actionId === "register_comment") {
        // Open modal for comment input
        await openCommentModal(triggerId, listItemId, channel, messageTs);
      } else if (actionId === "approve_item") {
        // Extract title and type from original message
        const title = extractTitleFromMessage(payload.message);
        const typeLabel = extractTypeFromMessage(payload.message);
        const fullTitle = typeLabel ? `[${typeLabel}] ${title}` : title;
        await updateMessage(channel, messageTs, fullTitle, "승인");
      } else if (actionId === "reject_item") {
        const title = extractTitleFromMessage(payload.message);
        const typeLabel = extractTypeFromMessage(payload.message);
        const fullTitle = typeLabel ? `[${typeLabel}] ${title}` : title;
        await updateMessage(channel, messageTs, fullTitle, "반려");
      }

      return NextResponse.json({ ok: true });
    }

    // ─── View Submission (modal submit) ─────────────────────
    if (type === "view_submission") {
      const callbackId = payload.view?.callback_id;

      if (callbackId === "comment_modal_submit") {
        const comment =
          payload.view.state.values.comment_block.comment_input.value;
        const metadata = JSON.parse(payload.view.private_metadata);
        const { list_item_id, channel, message_ts } = metadata;

        // Update the list item with the comment
        await updateListItemComment(list_item_id, comment);

        // Optionally notify in the original message thread
        const SLACK_API_BASE = "https://slack.com/api";
        const botToken = process.env.SLACK_BOT_TOKEN;
        await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${botToken}`,
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            channel,
            thread_ts: message_ts,
            text: `의견이 등록되었습니다: ${comment}`,
          }),
        });

        // Return empty 200 to close modal
        return new NextResponse(null, { status: 200 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Interactions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function extractTitleFromMessage(message: {
  blocks?: Array<{
    type: string;
    text?: { text?: string };
  }>;
}): string {
  if (!message?.blocks) return "전자결재";
  const section = message.blocks.find((b) => b.type === "section");
  if (section?.text?.text) {
    const match = section.text.text.match(/\*제목:\*\s*(.+)/);
    if (match) return match[1].split("\n")[0].trim();
  }
  return "전자결재";
}

function extractTypeFromMessage(message: {
  blocks?: Array<{
    type: string;
    text?: { text?: string };
  }>;
}): string {
  if (!message?.blocks) return "";
  const section = message.blocks.find((b) => b.type === "section");
  if (section?.text?.text) {
    const match = section.text.text.match(/\*유형:\*\s*(.+)/);
    if (match) return match[1].split("\n")[0].trim();
  }
  return "";
}
