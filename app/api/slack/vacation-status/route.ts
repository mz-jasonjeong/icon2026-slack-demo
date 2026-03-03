import { NextResponse } from "next/server";
import { setVacationStatus } from "@/lib/slack";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    // Parse the date and set expiration to KST 23:59:59
    // KST = UTC+9, so KST 23:59:59 = UTC 14:59:59
    const targetDate = new Date(date);
    const kstEndOfDay = new Date(
      Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        14, // 23 - 9 = 14 UTC
        59,
        59
      )
    );

    const expirationUnix = Math.floor(kstEndOfDay.getTime() / 1000);

    await setVacationStatus(expirationUnix);

    return NextResponse.json({
      success: true,
      message: "휴가 상태가 적용되었습니다.",
      expiration: kstEndOfDay.toISOString(),
    });
  } catch (error) {
    console.error("Vacation status API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
