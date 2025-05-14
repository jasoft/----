"use server";

import { redirect } from "next/navigation";
import { submitRegistration } from "~/services/registration";

export async function createRegistration(
  activityId: string,
  formData: FormData,
) {
  try {
    await submitRegistration(activityId, formData);

    // 成功后重定向到结果页面
    redirect(`/activity/${activityId}/result`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "报名失败，请稍后重试";

    // 失败时重定向回报名页面并显示错误信息
    const searchParams = new URLSearchParams();
    searchParams.set("error", errorMessage);
    redirect(`/activity/${activityId}/register?${searchParams.toString()}`);
  }
}
