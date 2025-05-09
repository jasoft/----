"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Activity } from "~/lib/pb";
import { Dialog } from "~/components/ui/dialog";

interface ApiErrorResponse {
  message?: string;
  data?: Record<string, { message: string }>;
}

interface AdminAuthResponse {
  token: string;
  model: Record<string, unknown>;
}

import { ActivityForm } from "~/components/forms/activity-form";
import { Button } from "~/components/ui/button";

interface EditActivityFormProps {
  activity: Activity;
}

export function EditActivityForm({ activity }: EditActivityFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    content: string;
    deadline: string;
    winnersCount: number;
  }) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/activities/records/${activity.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify(data),
        },
      );

      if (!res.ok) {
        const errorData = (await res.json()) as ApiErrorResponse;
        throw new Error(errorData.message ?? "更新失败");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "更新失败");
    }
  };

  const handleDelete = async () => {
    // 使用 Dialog 确认删除
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

      // 首先获取管理员认证
      const authRes = await fetch("/api/admin/auth", {
        method: "POST",
      });

      if (!authRes.ok) {
        throw new Error("管理员认证失败");
      }

      const { token } = (await authRes.json()) as AdminAuthResponse;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/activities/records/${activity.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token,
          },
        },
      );

      if (!res.ok) {
        const errorData = (await res.json()) as ApiErrorResponse;
        throw new Error(errorData.message ?? "删除失败");
      }

      // 显示删除成功提示
      await Dialog.success("删除成功", `活动"${activity.title}"已成功删除`);

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
      // 显示错误提示
      await Dialog.error(
        "删除失败",
        err instanceof Error ? err.message : "操作过程中发生错误",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">编辑活动</h1>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/admin")} variant="outline">
            返回
          </Button>
          <Button
            data-testid="delete-activity"
            onClick={handleDelete}
            variant="destructive"
            disabled={isDeleting}
          >
            {isDeleting ? "删除中..." : "删除活动"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <ActivityForm
        onSubmit={handleSubmit}
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
