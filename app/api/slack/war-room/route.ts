import { NextResponse } from "next/server";
import { createWarRoom, warRoomInvite } from "@/lib/slack";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { issueTitle } = body;

    const warroomResult = await createWarRoom(issueTitle);
    const channelId = warroomResult.channel?.id ?? "unknown";

    await warRoomInvite(channelId);

    return NextResponse.json({
      success: true,
      message: `War Room 생성이 완료되었습니다.[${channelId}]`,
    });
  } catch (error) {
    console.error("Createion Channel API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
