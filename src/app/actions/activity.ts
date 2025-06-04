"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { activityService } from "~/services/activity";
import type { Activity } from "~/lib/pb";
import { activityDbSchema } from "~/lib/schemas/activity";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// 配置dayjs使用时区
dayjs.extend(utc);
dayjs.extend(timezone);

// 时区相关
const TIMEZONE = "Asia/Shanghai";
dayjs.tz.setDefault(TIMEZONE);

export type ActionResult<T = void> =
  | {
      success: true;
      data?: T;
    }
  | {
      success: false;
      error: string;
    };

export async function createActivity(formData: FormData): Promise<Activity> {
  try {
    // 从表单数据中提取值
    const deadlineLocal = formData.get("deadline") as string;
    if (!deadlineLocal) {
      throw new Error("截止时间不能为空");
    }

    // 将本地时间转换为UTC时间
    const deadlineUTC = dayjs(deadlineLocal).tz(TIMEZONE).utc().format();

    const rawData = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      deadline: deadlineUTC,
      winnersCount: Number(formData.get("winnersCount")),
      maxRegistrants: Number(formData.get("maxRegistrants")),
      isPublished: formData.get("isPublished") === "on",
      creatorId: formData.get("creatorId") as string,
    };

    console.log("Raw data before validation:", rawData);

    // 验证数据
    const validatedData = activityDbSchema.parse(rawData);

    // 保存活动到数据库
    const activity = await activityService.createActivity(validatedData);

    // 重新验证活动列表页面
    revalidatePath("/admin");

    return activity;
  } catch (error) {
    throw error;
  }
}

export async function updateActivity(
  id: string,
  formData: FormData,
): Promise<Activity> {
  try {
    // 从表单数据中提取值
    const deadlineLocal = formData.get("deadline") as string;
    if (!deadlineLocal) {
      throw new Error("截止时间不能为空");
    }

    // 将本地时间转换为UTC时间
    const deadlineUTC = dayjs(deadlineLocal).tz(TIMEZONE).utc().format();

    const rawData = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      deadline: deadlineUTC,
      winnersCount: Number(formData.get("winnersCount")),
      maxRegistrants: Number(formData.get("maxRegistrants")),
      isPublished: formData.get("isPublished") === "on",
      creatorId: formData.get("creatorId") as string,
    };

    // 验证数据
    const validatedData = activityDbSchema.parse(rawData);

    // 更新数据库中的活动
    const activity = await activityService.updateActivity(id, validatedData);

    // 重新验证活动列表和详情页面
    revalidatePath("/admin");
    revalidatePath(`/admin/${id}`);

    return activity;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : "更新活动失败");
  }
}

export async function deleteActivity(formData: FormData) {
  try {
    const id = formData.get("id");
    if (!id || typeof id !== "string") {
      throw new Error("活动ID无效");
    }

    await activityService.deleteActivity(id);

    revalidatePath("/admin");
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "删除活动失败");
  }
}

export async function togglePublish(formData: FormData) {
  try {
    const id = formData.get("id");
    const isPublished = formData.get("isPublished") === "true";

    if (!id || typeof id !== "string") {
      throw new Error("活动ID无效");
    }

    await activityService.updateActivity(id, {
      isPublished: !isPublished,
    });

    revalidatePath("/admin");
    revalidatePath(`/activity/${id}/result`);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "更新发布状态失败",
    );
  }
}

export async function drawWinners(formData: FormData) {
  try {
    const id = formData.get("id");
    if (!id || typeof id !== "string") {
      throw new Error("活动ID无效");
    }

    const endNow = formData.get("endNow") === "true";
    if (endNow) {
      // 更新截止时间为当前时间-1分钟
      const newDeadline = new Date(Date.now() - 60000).toISOString();
      await activityService.updateActivity(id, {
        deadline: newDeadline,
      });
    }

    await activityService.drawWinners(id);

    revalidatePath("/admin");
    revalidatePath(`/activity/${id}/result`);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "抽签失败");
  }
}
