"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Activity } from "~/lib/pb";
import { Dialog } from "~/components/ui/dialog";
import { ActivityForm } from "~/components/forms/activity-form";
import { activityService } from "~/services/activity";

interface EditActivityFormProps {
  activity: Activity;
}

export function EditActivityForm({ activity }: EditActivityFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    content: string;
    deadline: string;
    winnersCount: number;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await activityService.updateActivity(activity.id, data);
      // 更新成功直接跳转
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
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
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败，请重试");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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

      <ActivityForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        defaultValues={{
          title: activity.title,
          content: activity.content,
          deadline: new Date(activity.deadline).toISOString().slice(0, 16),
          winnersCount: activity.winnersCount,
        }}
      />
    </>
  );
}
