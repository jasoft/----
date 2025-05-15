"use client";

import type { Activity } from "~/lib/pb";
import { Dialog } from "~/components/ui/dialog";
import { activityService } from "~/services/activity";
import { formatDate, isExpired, getTimeLeft } from "~/lib/utils";
import { useToast } from "~/components/ui/toast";

interface ManageActivityListProps {
  activities: Activity[];
  onDeleted?: () => void;
}

export function ManageActivityList({
  activities,
  onDeleted,
}: ManageActivityListProps) {
  const { showToast } = useToast();

  const handleDelete = async (activity: Activity) => {
    const confirmed = await Dialog.confirm(
      "确认删除",
      `确定要删除活动"${activity.title}"吗？此操作不可恢复。`,
    );

    if (confirmed) {
      try {
        await activityService.deleteActivity(activity.id);
        showToast(`活动"${activity.title}"已删除`, "success");
        onDeleted?.();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "活动删除失败",
          "error",
        );
      }
    }
  };

  const handleTogglePublish = async (activity: Activity) => {
    try {
      await activityService.updateActivity(activity.id, {
        isPublished: !activity.isPublished,
      });

      showToast(
        `活动已${activity.isPublished ? "取消发布" : "发布"}`,
        "success",
      );
      onDeleted?.();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "状态更新失败",
        "error",
      );
    }
  };

  const handleDraw = async (activity: Activity) => {
    const confirmed = await Dialog.confirm(
      "确认抽签",
      `确定要为活动"${activity.title}"进行抽签吗？此操作不可撤销。`,
    );

    if (confirmed) {
      try {
        await activityService.drawWinners(activity.id);
        showToast("抽签完成", "success");
        onDeleted?.();
      } catch (error) {
        showToast(error instanceof Error ? error.message : "抽签失败", "error");
      }
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {activities.map((activity) => {
        const expired = isExpired(activity.deadline);
        const registrations = activity.expand?.registrations ?? [];
        const registrationsCount = registrations.length;

        return (
          <div
            key={activity.id}
            data-testid={`activity-${activity.id}`}
            className={`card shadow-xl ${
              expired ? "bg-neutral-100" : "bg-base-100"
            }`}
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h2 className="card-title">{activity.title}</h2>
                <span
                  className={`badge ${
                    activity.isPublished ? "badge-primary" : "badge-ghost"
                  }`}
                >
                  {activity.isPublished ? "已发布" : "未发布"}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-neutral-500">
                  截止时间: {formatDate(activity.deadline)}
                </p>
                <p
                  className={`text-sm ${
                    expired ? "text-neutral-500" : "text-primary"
                  }`}
                >
                  {getTimeLeft(activity.deadline)}
                </p>
              </div>

              <p className="line-clamp-3 text-sm text-neutral-600">
                {activity.content}
              </p>

              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <span>👥</span>
                  <span>已报名: {registrationsCount}人</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>🎯</span>
                  <span>中签名额: {activity.winnersCount}人</span>
                </span>
              </div>

              {registrationsCount > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-neutral-600">
                    报名者：
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {registrations.map((reg) => (
                      <span
                        key={reg.id}
                        className="badge badge-sm badge-ghost"
                        title={reg.phone}
                      >
                        {reg.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="card-actions mt-4 flex flex-wrap gap-2">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                  <a
                    href={`/activity/${activity.id}/result`}
                    className="btn btn-sm btn-info w-full"
                    data-testid={`view-result-${activity.id}`}
                  >
                    查看结果
                  </a>
                  <a
                    href={`/admin/${activity.id}/edit`}
                    className="btn btn-sm btn-secondary w-full"
                    data-testid={`edit-activity-${activity.id}`}
                  >
                    编辑活动
                  </a>
                  <button
                    onClick={() => void handleTogglePublish(activity)}
                    data-testid={`toggle-publish-${activity.id}`}
                    className={`btn btn-sm w-full ${
                      activity.isPublished ? "btn-warning" : "btn-success"
                    }`}
                  >
                    {activity.isPublished ? "停止发布" : "开始发布"}
                  </button>
                  {expired && registrationsCount > 0 && (
                    <button
                      onClick={() => void handleDraw(activity)}
                      className="btn btn-sm btn-primary w-full"
                      data-testid={`draw-activity-${activity.id}`}
                    >
                      执行抽签
                    </button>
                  )}
                  <button
                    onClick={() => void handleDelete(activity)}
                    className="btn btn-sm btn-error w-full"
                    data-testid={`delete-activity-${activity.id}`}
                  >
                    删除活动
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {activities.length === 0 && (
        <div className="col-span-full rounded-lg bg-neutral-50 p-8 text-center">
          <p className="text-neutral-600">暂无活动数据</p>
        </div>
      )}
    </div>
  );
}
