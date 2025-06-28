import { NextResponse } from "next/server";
import { getCachedCurrentUser } from "~/services/auth-cache-simple";
import { activityService } from "~/services/activity";

/**
 * 获取当前用户的活动列表
 * 这个 API 路由确保只返回当前登录用户创建的活动
 */
export async function GET(request: Request) {
  try {
    // 获取当前用户信息
    const user = await getCachedCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 检查是否需要强制刷新
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    // 获取当前用户的活动列表
    const activities = await activityService.getAdminActivityList(
      user.id,
      forceRefresh,
    );

    const response = NextResponse.json({
      success: true,
      activities,
      userId: user.id,
    });

    // 设置缓存控制头，确保数据实时性
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("获取用户活动列表失败:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "获取活动列表失败",
        success: false,
      },
      { status: 500 },
    );
  }
}
