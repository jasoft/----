import { NextResponse } from "next/server";
import { getCacheStats } from "~/services/auth-cache-simple";

export async function GET() {
  try {
    const stats = await getCacheStats();

    return NextResponse.json({
      success: true,
      stats,
      message: `内存缓存: ${stats.validEntries} 个有效条目，${stats.expiredEntries} 个过期条目`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
