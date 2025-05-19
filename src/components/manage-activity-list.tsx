"use client";

import { type ReactElement } from "react";
import type { Activity } from "~/lib/pb";
import { Dialog } from "~/components/ui/dialog";
import { formatDate, isExpired, getTimeLeft } from "~/lib/utils";
import { useToast } from "~/components/ui/toast";
import { activityService } from "~/services/activity";

interface ManageActivityListProps {
  activities: Activity[];
  onDeleted?: () => void;
}

export function ManageActivityList({
  activities,
  onDeleted,
}: ManageActivityListProps): ReactElement {
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
      // 更新发布状态
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

      // 如果需要提前结束，先更新截止时间
      if (!isExpired(activity.deadline)) {
        await activityService.updateActivity(activity.id, {
          deadline: new Date().toISOString(),
        });
      }

      await activityService.drawWinners(activity.id);
      showToast(hasDrawn ? "已重新抽签" : "抽签完成", "success");
      onDeleted?.();

      // 跳转到结果页面
      window.location.href = `/activity/${activity.id}/result`;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "抽签失败", "error");
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const expired = isExpired(activity.deadline);
        const registrations = activity.expand?.registrations ?? [];
        const registrationsCount = registrations.length;
        const hasDrawn = registrations.some((r) => r.isWinner);

        return (
          <div
            key={activity.id}
            data-testid={`activity-${activity.id}`}
            className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
              expired ? "bg-gray-50" : ""
            }`}
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-medium">{activity.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activity.isPublished && (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      已发布
                    </span>
                  )}
                  {hasDrawn && (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      已抽签
                    </span>
                  )}
                  {expired && (
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      已结束
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">
                    截止时间: {formatDate(activity.deadline)}
                  </p>
                  <p
                    className={`text-sm ${expired ? "text-gray-500" : "text-blue-600"}`}
                  >
                    {getTimeLeft(activity.deadline)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    已报名: {registrationsCount}人
                  </span>
                  <span className="flex items-center gap-1">
                    中签: {activity.winnersCount}人
                  </span>
                </div>

                {registrationsCount > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">报名者:</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {registrations.map((reg) => (
                        <span
                          key={reg.id}
                          className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                          title={reg.phone}
                        >
                          {reg.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href={`/activity/${activity.id}/result`}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-700/20 ring-inset hover:bg-indigo-100"
                  data-testid={`view-result-${activity.id}`}
                >
                  查看报名
                </a>
                <a
                  href={`/admin/${activity.id}/edit`}
                  className="inline-flex items-center justify-center rounded-md bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 ring-1 ring-purple-700/20 ring-inset hover:bg-purple-100"
                  data-testid={`edit-activity-${activity.id}`}
                >
                  编辑活动
                </a>
                <button
                  onClick={() => void handleTogglePublish(activity)}
                  data-testid={`toggle-publish-${activity.id}`}
                  className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium ${
                    activity.isPublished
                      ? "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20 ring-inset hover:bg-yellow-100"
                      : "bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset hover:bg-green-100"
                  }`}
                >
                  {activity.isPublished ? "停止发布" : "开始发布"}
                </button>
                {registrationsCount > 0 && (
                  <button
                    onClick={() => void handleDraw(activity)}
                    data-testid={`draw-activity-${activity.id}`}
                    className="inline-flex items-center justify-center rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-700/20 ring-inset hover:bg-blue-100"
                  >
                    {hasDrawn ? "重新抽签" : "执行抽签"}
                  </button>
                )}
                <button
                  onClick={() => void handleDelete(activity)}
                  data-testid={`delete-activity-${activity.id}`}
                  className="inline-flex items-center justify-center rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-600/20 ring-inset hover:bg-red-100"
                >
                  删除活动
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {activities.length === 0 && (
        <div className="rounded-lg bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">暂无活动数据</p>
        </div>
      )}
    </div>
  );
}
