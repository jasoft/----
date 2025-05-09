"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Activity } from "~/lib/pb";
import { ActivityForm } from "~/components/forms/activity-form";
import { Dialog } from "~/components/ui/dialog";
import { activityService } from "~/services/activity";

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (data: Omit<Activity, "id" | "created" | "updated">) => {
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
            return;
          }
        }

        if (mode === "create") {
          await activityService.createActivity(data);
        } else if (activity?.id) {
          await activityService.updateActivity(activity.id, data);
        }

        // 显示成功提示
        await Dialog.success(
          `活动${mode === "create" ? "创建" : "更新"}成功`,
          `活动"${data.title}"已成功${mode === "create" ? "创建" : "更新"}`,
        );

        // 重定向到列表页
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

  const defaultValues = activity
    ? {
        title: activity.title,
        content: activity.content,
        deadline: activity.deadline.slice(0, 16), // 转换为datetime-local格式
        winnersCount: activity.winnersCount,
      }
    : undefined;

  return (
    <ActivityForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
    />
  );
}
