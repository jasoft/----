"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Activity } from "~/lib/pb";
import { ActivityForm } from "~/components/forms/activity-form";
import { Dialog } from "~/components/ui/dialog";
import { activityService } from "~/services/activity";

// 配置dayjs使用时区
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Shanghai");

interface ActivityContainerProps {
  mode: "create" | "edit";
  activity?: Activity;
  redirectUrl?: string;
}

export function ActivityContainer({
  mode,
  activity,
  redirectUrl = "/admin",
}: ActivityContainerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (data: {
      title: string;
      content: string;
      deadline: string;
      winnersCount: number;
      maxRegistrants: number;
      isPublished: boolean;
    }) => {
      setIsSubmitting(true);
      setError(null);

      try {
        // 检查中签人数是否过多
        if (data.winnersCount > 500) {
          const confirmed = await Dialog.confirm(
            "中签人数确认",
            `您设置的中签人数为 ${data.winnersCount} 人，这可能会影响活动质量。确定要继续吗？`,
          );
          if (!confirmed) {
            setIsSubmitting(false);
            return;
          }
        }

        // 将时间转换为UTC时区
        const deadline = dayjs(data.deadline).tz().utc().format();
        const submitData = {
          ...data,
          deadline,
        };

        if (mode === "create") {
          await activityService.createActivity(submitData);
        } else if (activity?.id) {
          await activityService.updateActivity(activity.id, submitData);
        }

        // 直接重定向到列表页
        router.push(redirectUrl);
        router.refresh();
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("Network")) {
            setError("网络连接错误，请检查您的网络连接后重试");
          } else if (err.message.includes("timeout")) {
            setError("请求超时，请稍后重试");
          } else if (err.message.includes("Permission")) {
            setError("您没有权限执行此操作");
          } else if (err.message.includes("500")) {
            setError("服务器错误，请联系管理员");
          } else {
            setError(err.message || "提交失败，请重试");
          }
        } else {
          setError("未知错误，请重试");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, activity, redirectUrl, router],
  );

  const handleDelete = async () => {
    if (!activity?.id) return;

    const confirmed = await Dialog.confirm(
      "确认删除活动",
      "此操作将永久删除该活动及其所有相关数据，确定要继续吗？",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      await activityService.deleteActivity(activity.id);
      // 删除成功直接跳转
      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("删除失败，请重试");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultValues = activity
    ? {
        title: activity.title,
        content: activity.content,
        // 将UTC时间转换为本地时间
        deadline: dayjs(activity.deadline).tz().format("YYYY-MM-DDTHH:mm"),
        winnersCount: activity.winnersCount,
        maxRegistrants: activity.maxRegistrants,
        isPublished: activity.isPublished,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-4xl">
      {mode === "edit" && (
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">编辑活动</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="btn btn-ghost"
            >
              返回
            </button>
            <button
              data-testid="delete-activity"
              onClick={handleDelete}
              className="btn btn-error"
              disabled={isDeleting}
            >
              {isDeleting ? "删除中..." : "删除活动"}
            </button>
          </div>
        </div>
      )}

      <ActivityForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </div>
  );
}
