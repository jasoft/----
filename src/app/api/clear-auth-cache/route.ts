import { clearUserCache } from "~/services/auth-cache-simple";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await clearUserCache();

    return NextResponse.json({
      success: true,
      message: "缓存已清除",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
