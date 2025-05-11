"use client";

import { useState } from "react";
import Link from "next/link";
import type { Activity } from "~/lib/pb";
import { Dialog } from "~/components/ui/dialog";
import { activityService } from "~/services/activity";
import { formatDate } from "~/lib/utils";
import { useToast } from "~/components/ui/toast";

interface ManageActivityListProps {
  activities: Activity[];
  onDeleted?: () => void;
}

export function ManageActivityList({
  activities,
  onDeleted,
}: ManageActivityListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { showToast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await activityService.deleteActivity(id);
      const activity = activities.find((a) => a.id === id);
      showToast(`活动"${activity?.title ?? ""}"已删除`, "success");
      onDeleted?.();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "活动删除失败",
        "error",
      );
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
        // 等待对话框消失
        await new Promise((resolve) => setTimeout(resolve, 500));
        showToast("选中的活动已成功删除", "success");
        setSelectedIds([]);
        onDeleted?.();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "批量删除失败",
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

      showToast(`活动已${isActive ? "结束" : "开启"}`, "success");
      onDeleted?.();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "状态更新失败",
        "error",
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
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow lg:overflow-visible">
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

        <table className="table min-w-full table-fixed">
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
              <th className="w-1/4">活动信息</th>
              <th className="w-32">报名情况</th>
              <th className="w-48">时间信息</th>
              <th className="w-24">进行状态</th>
              <th className="w-24">发布状态</th>
              <th className="w-56">操作</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => {
              const now = new Date();
              const deadline = new Date(activity.deadline);
              const isActive = deadline > now;
              const registrationCount =
                activity.expand?.registrations_count ?? 0;

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
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        activity.isPublished
                          ? "bg-blue-100 text-blue-800"
                          : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {activity.isPublished ? "已发布" : "未发布"}
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
                        onClick={() => void handleTogglePublish(activity)}
                        className={`btn btn-sm ${
                          activity.isPublished ? "btn-warning" : "btn-success"
                        }`}
                      >
                        {activity.isPublished ? "取消发布" : "发布"}
                      </button>
                      <button
                        onClick={() => void handleToggleStatus(activity)}
                        className={`btn btn-sm ${
                          isActive ? "btn-warning" : "btn-success"
                        }`}
                      >
                        {isActive ? "结束" : "开启"}
                      </button>
                      <button
                        onClick={() => {
                          void Dialog.confirm(
                            "确认删除",
                            `确定要删除活动"${activity.title}"吗？此操作不可恢复。`,
                          ).then((confirmed) => {
                            if (confirmed) {
                              void handleDelete(activity.id);
                            }
                          });
                        }}
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
    </div>
  );
}
