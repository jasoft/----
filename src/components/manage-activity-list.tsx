"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const handleBatchDelete = async () => {
    const confirmed = await Dialog.confirm(
      "确认批量删除",
      `确定要删除选中的 ${selectedIds.length} 个活动吗？此操作不可恢复。`,
    );

    if (confirmed) {
      try {
        await Promise.all(
          selectedIds.map((id) => activityService.deleteActivity(id)),
        );
        await Dialog.success("删除成功", "选中的活动已被删除");
        setSelectedIds([]);
        onDeleted?.();
      } catch (error) {
        await Dialog.error(
          "删除失败",
          error instanceof Error ? error.message : "未知错误",
        );
      }
    }
  };

  const handleToggleStatus = async (activity: Activity) => {
    try {
      const now = new Date();
      const deadline = new Date(activity.deadline);
      const isActive = deadline > now;

      await activityService.updateActivity(activity.id, {
        deadline: isActive
          ? new Date(now.getTime() - 1000).toISOString()
          : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      });

      await Dialog.success(
        "状态更新成功",
        `活动已${isActive ? "结束" : "开启"}`,
      );
      onDeleted?.();
    } catch (error) {
      await Dialog.error(
        "更新失败",
        error instanceof Error ? error.message : "未知错误",
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? activities.map((a) => a.id) : []);
  };

  const handleSelectOne = (activityId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, activityId] : prev.filter((id) => id !== activityId),
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow">
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">
              已选择 {selectedIds.length} 个活动
            </span>
            <button
              onClick={() => void handleBatchDelete()}
              className="btn btn-sm btn-error"
            >
              批量删除
            </button>
          </div>
        </div>
      )}

      <table className="table w-full">
        <thead className="bg-neutral-50">
          <tr>
            <th className="w-16">
              <input
                type="checkbox"
                className="checkbox"
                checked={selectedIds.length === activities.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th>活动信息</th>
            <th>报名情况</th>
            <th>时间信息</th>
            <th>状态</th>
            <th className="w-48">操作</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => {
            const now = new Date();
            const deadline = new Date(activity.deadline);
            const isActive = deadline > now;
            const registrationCount = activity.expand?.registrations_count ?? 0;

            return (
              <tr
                key={activity.id}
                data-testid={`activity-${activity.id}`}
                className="border-b border-neutral-200 hover:bg-neutral-50"
              >
                <td>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedIds.includes(activity.id)}
                    onChange={(e) =>
                      handleSelectOne(activity.id, e.target.checked)
                    }
                  />
                </td>
                <td>
                  <div className="max-w-md">
                    <div className="font-medium">{activity.title}</div>
                    <div className="mt-1 line-clamp-2 text-sm text-neutral-500">
                      {activity.content}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-medium">
                        {registrationCount}
                      </span>
                      <span className="text-sm text-neutral-500">
                        / {activity.winnersCount}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500">
                      {Math.round(
                        (registrationCount / activity.winnersCount) * 100,
                      )}
                      % 已报名
                    </div>
                  </div>
                </td>
                <td>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-neutral-500">创建：</span>
                      {formatDate(activity.created)}
                    </div>
                    <div className="text-sm">
                      <span className="text-neutral-500">截止：</span>
                      {formatDate(activity.deadline)}
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {isActive ? "进行中" : "已结束"}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/${activity.id}`}
                      className="btn btn-sm btn-ghost"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => void handleToggleStatus(activity)}
                      className={`btn btn-sm ${
                        isActive ? "btn-warning" : "btn-success"
                      }`}
                    >
                      {isActive ? "结束" : "开启"}
                    </button>
                    <button
                      onClick={() => void handleDelete(activity)}
                      className="btn btn-sm btn-error"
                      data-testid={`delete-activity-${activity.id}`}
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {activities.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-neutral-600">暂无活动数据</p>
        </div>
      )}
    </div>
  );
}
