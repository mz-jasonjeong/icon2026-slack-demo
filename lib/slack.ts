const SLACK_API_BASE = "https://slack.com/api";

function getBotToken(): string {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN is not set");
  return token;
}

function getUserToken(): string {
  const token = process.env.SLACK_USER_TOKEN;
  if (!token) throw new Error("SLACK_USER_TOKEN is not set");
  return token;
}

async function slackApiCall(
  method: string,
  body: Record<string, unknown>,
  token?: string
) {
  const res = await fetch(`${SLACK_API_BASE}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token ?? getBotToken()}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Slack API error (${method}): ${data.error}`);
  }
  return data;
}

// ─── List Operations ──────────────────────────────────────────

// Approval type definitions
export const APPROVAL_TYPES: Record<string, string> = {
  OptVX9TTJMY: "연차",
  OptDWJGFTNE: "생일연차",
  OptLC1LAMZV: "보건연차",
};

// Fixed recipient (approver) User ID
export const APPROVER_USER_ID = "U0AGKHQQGBV";

export async function createListItem(title: string, desc: string, approvalType: string, startdt: number, enddt: number) {
  const listId = process.env.SLACK_LIST_ID;
  const titleColumnId = process.env.SLACK_LIST_TITLE_COLUMN_ID;
  const descColumnId = process.env.SLACK_LIST_DESCRIPTION_COLUMN_ID;
  const typeColumnId = process.env.SLACK_LIST_TYPE_COLUMN_ID;

  const requesterColumnId = process.env.SLICK_LIST_REQUESTER_COLUMN_ID;
  const approverColumnId = process.env.SLICK_LIST_APPROVER_COLUMN_ID;

  const startDTColumnId = process.env.SLICK_LIST_STARTDT_COLUMN_ID;
  const endDTColumnId = process.env.SLICK_LIST_ENDDT_COLUMN_ID;

  if (!listId || !titleColumnId || !typeColumnId) {
    throw new Error("SLACK_LIST_ID, SLACK_LIST_TITLE_COLUMN_ID, or SLACK_LIST_TYPE_COLUMN_ID is not set");
  }

  return slackApiCall("slackLists.items.create", {
    list_id: listId,
    initial_fields: [
      {
        column_id: titleColumnId,
        rich_text: [
          {
            type: "rich_text",
            elements: [
              {
                type: "rich_text_section",
                elements: [{ type: "text", text: title }],
              },
            ],
          },
        ],
      },
      {
        column_id: typeColumnId,
        select: [approvalType],
      },
      {
        column_id: descColumnId,
        rich_text: [
          {
            type: "rich_text",
            elements: [
              {
                type: "rich_text_section",
                elements: [{ type: "text", text: desc }],
              },
            ],
          },
        ],
      },

      {
        column_id: requesterColumnId,
        user: ['U0AGNGQ1KFF'],
      },
      {
        column_id: approverColumnId,
        user: ['U0AGKHQQGBV'],
      },

      {
        column_id: startDTColumnId,
        date: [startdt],
      },
      {
        column_id: endDTColumnId,
        date: [enddt],
      },

    ],
  });
}

export async function updateListItemComment(
  itemId: string,
  comment: string
) {
  const listId = process.env.SLACK_LIST_ID;
  const commentColumnId = process.env.SLACK_LIST_COMMENT_COLUMN_ID;

  if (!listId || !commentColumnId) {
    throw new Error(
      "SLACK_LIST_ID or SLACK_LIST_COMMENT_COLUMN_ID is not set"
    );
  }

  return slackApiCall("slackLists.items.update", {
    list_id: listId,
    cells: [
      {
        row_id: itemId,
        column_id: commentColumnId,
        rich_text: [
          {
            type: "rich_text",
            elements: [
              {
                type: "rich_text_section",
                elements: [{ type: "text", text: comment }],
              },
            ],
          },
        ],
      },
    ],
  });
}

// ─── Messaging ────────────────────────────────────────────────

export async function openDmChannel(userId: string) {
  const data = await slackApiCall("conversations.open", {
    users: userId,
  });
  return data.channel.id as string;
}

export async function sendApprovalDm(
  userId: string,
  title: string,
  approvalType: string,
  listItemId: string
) {
  // const channelId = await openDmChannel(userId);
  const typeLabel = APPROVAL_TYPES[approvalType] ?? approvalType;

  return slackApiCall("chat.postMessage", {
    channel: userId,
    text: `전자결재가 도착했습니다: [${typeLabel}] ${title}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "전자결재 도착",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*유형:* ${typeLabel}\n*제목:* ${title}\n\n결재 문서가 도착했습니다. 아래 버튼을 통해 처리해주세요.`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "의견등록",
            },
            style: "primary",
            action_id: "register_comment",
            value: listItemId,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "승인",
            },
            style: "primary",
            action_id: "approve_item",
            value: listItemId,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "반려",
            },
            style: "danger",
            action_id: "reject_item",
            value: listItemId,
          },
        ],
      },
    ],
  });
}

export async function updateMessage(
  channel: string,
  ts: string,
  title: string,
  status: string
) {
  const statusEmoji = status === "승인" ? "white_check_mark" : "x";

  return slackApiCall("chat.update", {
    channel,
    ts,
    text: `전자결재 ${status}됨: ${title}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `전자결재 ${status}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*제목:* ${title}\n\n:${statusEmoji}: 이 결재 문서는 *${status}* 처리되었습니다.`,
        },
      },
    ],
  });
}

// ─── User Status ──────────────────────────────────────────────

export async function setVacationStatus(expirationUnix: number) {
  return slackApiCall(
    "users.profile.set",
    {
      profile: {
        status_text: "휴가중",
        status_emoji: ":palm_tree:",
        status_expiration: expirationUnix,
      },
    },
    getUserToken()
  );
}

// ─── Interaction Modal ────────────────────────────────────────

export async function openCommentModal(
  triggerId: string,
  listItemId: string,
  channel: string,
  messageTs: string
) {
  return slackApiCall("views.open", {
    trigger_id: triggerId,
    view: {
      type: "modal",
      callback_id: "comment_modal_submit",
      private_metadata: JSON.stringify({
        list_item_id: listItemId,
        channel,
        message_ts: messageTs,
      }),
      title: {
        type: "plain_text",
        text: "의견 등록",
      },
      submit: {
        type: "plain_text",
        text: "등록",
      },
      close: {
        type: "plain_text",
        text: "취소",
      },
      blocks: [
        {
          type: "input",
          block_id: "comment_block",
          label: {
            type: "plain_text",
            text: "의견",
          },
          element: {
            type: "plain_text_input",
            action_id: "comment_input",
            multiline: true,
            placeholder: {
              type: "plain_text",
              text: "의견을 입력해주세요...",
            },
          },
        },
      ],
    },
  });
}
