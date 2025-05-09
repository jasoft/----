"use client";

import type { Activity } from "~/lib/pb";
import { Dialog } from "~/components/ui/dialog";
import { activityService } from "~/services/activity";
import { formatDate } from "~/lib/utils";

interface ManageActivityListProps {
  activities: Activity[];
  onDeleted?: () => void;
}

export function ManageActivityList({
  activities,
  onDeleted,
}: ManageActivityListProps) {
  const handleDelete = async (activity: Activity) => {
    const confirmed = await Dialog.confirm(
      "确认删除",
      `确定要删除活动"${activity.title}"吗？此操作不可恢复。`,
    );

    if (confirmed) {
      try {
        await activityService.deleteActivity(activity.id);
        await Dialog.success("删除成功", "活动已被删除");
        onDeleted?.();
      } catch (error) {
        await Dialog.error(
          "删除失败",
          error instanceof Error ? error.message : "未知错误",
        );
      }
    }
  };

  return (
    <div
      data-testid="activity-list"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {activities.map((activity) => (
        <div
          key={activity.id}
          data-testid={`activity-${activity.id}`}
          className="card bg-base-100 shadow-xl"
        >
          <div className="card-body">
            <h2 className="card-title">{activity.title}</h2>
            <p className="text-sm text-neutral-500">
              截止时间: {formatDate(activity.deadline)}
            </p>
            <p className="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">
              {activity.content}
            </p>
            <div className="card-actions flex-wrap items-center">
              <p className="flex items-center gap-1 text-sm text-neutral-500">
                <span>👥 中签名额: {activity.winnersCount}人</span>
              </p>
              <div className="ml-auto flex gap-2">
                <button
                  className="btn btn-sm btn-error"
                  onClick={() => void handleDelete(activity)}
                  data-testid={`delete-activity-${activity.id}`}
                >
                  删除
                </button>
                <a
                  href={`/admin/${activity.id}`}
                  className="btn btn-sm btn-ghost"
                >
                  编辑
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
