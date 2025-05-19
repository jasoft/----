"use server";

import { z } from "zod";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { revalidatePath } from "next/cache";
import { activityService } from "~/services/activity";
import type { Activity } from "~/lib/pb";

// 配置dayjs使用时区
dayjs.extend(utc);
dayjs.extend(timezone);

// 时区相关
const TIMEZONE = "Asia/Shanghai";
dayjs.tz.setDefault(TIMEZONE);

// 验证模式
const activitySchema = z
  .object({
    title: z
      .string()
      .min(1, "活动标题不能为空")
      .max(50, "标题不能超过50个字符")
      .trim(),
    content: z.string().min(1, "活动描述不能为空").trim(),
    deadline: z
      .string()
      .min(1, "截止时间不能为空")
      .refine((val) => {
        const date = dayjs(val).tz(TIMEZONE);
        const now = dayjs().tz(TIMEZONE);
        return date.isAfter(now);
      }, "截止时间必须是未来时间"),
    winnersCount: z
      .number()
      .min(1, "中签人数不能小于1")
      .max(1000, "中签人数不能超过1000人"),
    maxRegistrants: z
      .number()
      .min(1, "最大报名人数不能小于1")
      .max(10000, "最大报名人数不能超过10000人"),
    isPublished: z.boolean(),
  })
  .refine(
    (data) => {
      return data.maxRegistrants >= data.winnersCount;
    },
    {
      message: "最大报名人数必须大于或等于中签人数",
      path: ["maxRegistrants"],
    },
  );

export type ActivityFormData = z.infer<typeof activitySchema>;

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
    };

    // 验证数据
    const validatedData = activitySchema.parse(rawData);

    // 保存活动到数据库
    const activity = await activityService.createActivity(validatedData);

    // 重新验证活动列表页面
    revalidatePath("/admin");

    return activity;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0]?.message ?? "表单数据验证失败");
    }
    throw new Error(error instanceof Error ? error.message : "创建活动失败");
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
    };

    // 验证数据
    const validatedData = activitySchema.parse(rawData);

    // 更新数据库中的活动
    const activity = await activityService.updateActivity(id, validatedData);

    // 重新验证活动列表和详情页面
    revalidatePath("/admin");
    revalidatePath(`/admin/${id}`);

    return activity;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0]?.message ?? "表单数据验证失败");
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
