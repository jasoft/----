"use client";

import type { Activity } from "~/lib/pb";
import { Dialog } from "~/components/ui/dialog";
import { formatDate, isExpired, getTimeLeft } from "~/lib/utils";
import { useToast } from "~/components/ui/toast";
import {
  deleteActivity,
  togglePublish,
  drawWinners,
} from "~/app/actions/activity";

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
        const formData = new FormData();
        formData.append("id", activity.id);

        await deleteActivity(formData);
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
      const formData = new FormData();
      formData.append("id", activity.id);
      formData.append("isPublished", activity.isPublished.toString());

      await togglePublish(formData);
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
    try {
      const hasDrawn = activity.expand?.registrations?.some((r) => r.isWinner);

      if (hasDrawn) {
        const confirmed = await Dialog.confirm(
          "重新抽签",
          `活动"${activity.title}"已经完成抽签，是否要重新抽签？\n\n注意：此操作将清除当前的抽签结果，重新进行抽签。`,
        );

        if (!confirmed) {
          return;
        }
      } else if (!isExpired(activity.deadline)) {
        const confirmed = await Dialog.confirm(
          "提前结束活动",
          `活动"${activity.title}"还未到结束时间，是否要提前结束活动并进行抽签？\n\n注意：此操作将把活动截止时间改为当前时间，并立即进行抽签。`,
        );

        if (!confirmed) {
          return;
        }
      }

      const formData = new FormData();
      formData.append("id", activity.id);
      formData.append("endNow", (!isExpired(activity.deadline)).toString());

      await drawWinners(formData);
      showToast(hasDrawn ? "已重新抽签" : "抽签完成", "success");
      onDeleted?.();

      // 跳转到结果页面
      window.location.href = `/activity/${activity.id}/result`;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "抽签失败", "error");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {activities.map((activity) => {
        const expired = isExpired(activity.deadline);
        const registrations = activity.expand?.registrations ?? [];
        const registrationsCount = registrations.length;
        const hasDrawn = registrations.some((r) => r.isWinner);

        return (
          <div
            key={activity.id}
            data-testid={`activity-${activity.id}`}
            className={`card shadow-xl ${
              expired ? "bg-neutral-100" : "bg-base-100"
            }`}
          >
            <div className="card-body">
              <h2 className="card-title mb-2">{activity.title}</h2>
              <div className="flex flex-wrap gap-2">
                {hasDrawn && (
                  <span className="badge badge-success">已抽签</span>
                )}
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
                    查看报名
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
                  {registrationsCount > 0 && (
                    <button
                      onClick={() => void handleDraw(activity)}
                      className="btn btn-sm btn-primary w-full"
                      data-testid={`draw-activity-${activity.id}`}
                    >
                      {hasDrawn ? "重新抽签" : "执行抽签"}
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
