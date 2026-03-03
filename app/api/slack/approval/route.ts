import { NextResponse } from "next/server";
import {
  createListItem,
  sendApprovalDm,
  APPROVER_USER_ID,
  APPROVAL_TYPES,
} from "@/lib/slack";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, desc, approvalType, startdt, enddt } = body;

    if (!title || !approvalType) {
      return NextResponse.json(
        { error: "title and approvalType are required" },
        { status: 400 }
      );
    }

    if (!APPROVAL_TYPES[approvalType]) {
      return NextResponse.json(
        { error: "Invalid approvalType" },
        { status: 400 }
      );
    }

// startdt:startdtString,
// enddt:enddtString,

    // 1. Create a list item in Slack Lists
    const listResult = await createListItem(title, desc, approvalType, startdt, enddt);
    const listItemId = listResult.item?.id ?? "unknown";

    // 2. Send DM to the fixed approver with approval buttons
    await sendApprovalDm(APPROVER_USER_ID, title, approvalType, listItemId);

    return NextResponse.json({
      success: true,
      message: "전자결재가 발송되었습니다.",
      listItemId,
    });
  } catch (error) {
    console.error("Approval API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
