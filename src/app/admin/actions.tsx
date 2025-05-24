"use server";

import { activityService } from "~/services/activity";
import { currentUser } from "@clerk/nextjs/server";
export async function fetchAdminActivitiesOnServer() {
  try {
    const items = await activityService.getAdminActivityList(
      (await currentUser())?.id ?? undefined,
    );
    // 成功时返回数据
    return { success: true, data: items };
  } catch (err) {
    let errorMessage = "加载活动列表失败";
    if (err instanceof Error) {
      if (err.message.includes("network")) {
        errorMessage = "网络连接失败，请检查网络后重试";
      } else if (err.message.includes("timeout")) {
        errorMessage = "请求超时，请稍后重试";
      } else {
        errorMessage = `加载失败: ${err.message}`;
      }
    }
    // 失败时返回错误信息
    return { success: false, error: errorMessage };
  }
}
