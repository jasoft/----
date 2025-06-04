"use client";

import { type ReactElement } from "react";
import type { Activity } from "~/lib/pb";
import { Dialog } from "~/components/ui/dialog";
import { formatDate, isExpired, getTimeLeft } from "~/lib/utils";
import { useToast } from "~/components/ui/toast";
import { useClientUrl } from "~/hooks/use-client-url";
import { activityService } from "~/services/activity";
import {
  Calendar,
  Users,
  Trophy,
  Share2,
  Edit,
  Eye,
  Play,
  Pause,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ManageActivityListProps {
  activities: Activity[];
  onDeleted?: () => void;
}

export function ManageActivityList({
  activities,
  onDeleted,
}: ManageActivityListProps): ReactElement {
  const { showToast } = useToast();
  const { getResultUrl, mounted: urlMounted } = useClientUrl();

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
        console.error("Delete activity error:", error);

        // 特殊处理 ClientResponseError
        if (error && typeof error === "object" && "status" in error) {
          const clientError = error as { status: number; message?: string };
          if (clientError.status === 404) {
            // 如果活动已经不存在，也算删除成功
            showToast(`活动"${activity.title}"已删除`, "success");
            onDeleted?.();
            return;
          }
        }

        const errorMessage =
          error instanceof Error ? error.message : "活动删除失败，请稍后重试";
        showToast(errorMessage, "error");
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

      // 在新窗口打开结果页面
      window.open(
        `/activity/${activity.id}/result`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "抽签失败", "error");
    }
  };

  const handleShare = async (activity: Activity) => {
    try {
      // 确保在客户端环境下执行
      if (!urlMounted) {
        showToast("页面还未加载完成，请稍后重试", "error");
        return;
      }

      const url = getResultUrl(activity.id);

      // 检查是否支持现代剪贴板API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // 降级方案：使用传统的复制方法
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          document.execCommand("copy");
        } catch (err) {
          console.warn("复制失败:", err);
          throw new Error("复制失败");
        } finally {
          document.body.removeChild(textArea);
        }
      }

      await Dialog.success(
        "链接已复制",
        "报名结果页面链接已复制到剪贴板，可以分享到其他APP",
      );
    } catch (error) {
      console.error("Copy failed:", error);
      showToast("复制链接失败，请手动复制地址栏链接", "error");
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {activities.map((activity) => {
        const expired = isExpired(activity.deadline);
        const registrations = activity.expand?.registrations ?? [];
        const registrationsCount = registrations.length;
        const hasDrawn = registrations.some((r) => r.isWinner);

        return (
          <div
            key={activity.id}
            data-testid={`activity-${activity.id}`}
            className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 ${
              expired
                ? "bg-gradient-to-br from-gray-50 to-gray-100"
                : "bg-gradient-to-br from-white to-blue-50/30"
            }`}
          >
            {/* 优雅标题背景 */}
            <div className="relative bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-100 p-4 sm:p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
              <div className="relative">
                <h3 className="line-clamp-2 text-xl leading-tight font-semibold text-gray-800 sm:text-xl">
                  {activity.title}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activity.isPublished && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2 py-1 text-sm font-medium text-blue-700 sm:text-sm">
                      <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4" />
                      已发布
                    </span>
                  )}
                  {hasDrawn && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2 py-1 text-sm font-medium text-green-700 sm:text-sm">
                      <Trophy className="h-4 w-4 sm:h-4 sm:w-4" />
                      已抽签
                    </span>
                  )}
                  {expired && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-medium text-gray-600 sm:text-sm">
                      <XCircle className="h-4 w-4 sm:h-4 sm:w-4" />
                      已结束
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 卡片内容 */}
            <div className="space-y-4 p-4 sm:p-6">
              {/* 时间信息 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-base text-gray-600 sm:text-base">
                  <Calendar className="h-5 w-5 text-blue-500 sm:h-5 sm:w-5" />
                  <span>截止时间: {formatDate(activity.deadline)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock
                    className={`h-5 w-5 sm:h-5 sm:w-5 ${expired ? "text-gray-400" : "text-orange-500"}`}
                  />
                  <span
                    className={`text-base font-medium sm:text-base ${expired ? "text-gray-500" : "text-orange-600"}`}
                  >
                    {getTimeLeft(activity.deadline)}
                  </span>
                </div>
              </div>

              {/* 统计信息 - 简化显示 */}
              <div className="flex items-center justify-between text-base text-gray-600 sm:text-base">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600 sm:h-5 sm:w-5" />
                  <span>
                    报名:{" "}
                    <span className="font-semibold text-blue-700">
                      {registrationsCount}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-600 sm:h-5 sm:w-5" />
                  <span>
                    中签:{" "}
                    <span className="font-semibold text-purple-700">
                      {activity.winnersCount}
                    </span>
                  </span>
                </div>
              </div>

              {/* 报名者列表 */}
              {registrationsCount > 0 && (
                <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
                  <p className="mb-2 text-base font-medium text-gray-700 sm:text-base">
                    报名者 ({registrationsCount}人):
                  </p>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {registrations.map((reg) => (
                      <span
                        key={reg.id}
                        className="inline-flex items-center rounded-full bg-white px-2 py-1 text-sm text-gray-600 shadow-sm sm:px-3 sm:py-1.5 sm:text-sm"
                        title={reg.phone}
                      >
                        {reg.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3 lg:grid-cols-2 xl:grid-cols-3">
                <a
                  href={`/activity/${activity.id}/result`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-indigo-50 px-3 py-3 text-base font-medium text-indigo-700 transition-colors hover:bg-indigo-100 sm:gap-2 sm:px-4 sm:py-3 sm:text-base"
                  data-testid={`view-result-${activity.id}`}
                >
                  <Eye className="h-5 w-5 sm:h-5 sm:w-5" />
                  查看报名
                </a>

                <button
                  type="button"
                  onClick={() => void handleShare(activity)}
                  className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-green-50 px-3 py-3 text-base font-medium text-green-700 transition-colors hover:bg-green-100 sm:gap-2 sm:px-4 sm:py-3 sm:text-base"
                  data-testid={`share-activity-${activity.id}`}
                >
                  <Share2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  分享链接
                </button>

                <a
                  href={`/admin/${activity.id}/edit`}
                  className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-purple-50 px-3 py-3 text-base font-medium text-purple-700 transition-colors hover:bg-purple-100 sm:gap-2 sm:px-4 sm:py-3 sm:text-base"
                  data-testid={`edit-activity-${activity.id}`}
                >
                  <Edit className="h-5 w-5 sm:h-5 sm:w-5" />
                  编辑活动
                </a>

                <button
                  type="button"
                  onClick={() => void handleTogglePublish(activity)}
                  data-testid={`toggle-publish-${activity.id}`}
                  className={`inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg px-3 py-3 text-base font-medium transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-base ${
                    activity.isPublished
                      ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {activity.isPublished ? (
                    <>
                      <Pause className="h-5 w-5 sm:h-5 sm:w-5" />
                      停止发布
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 sm:h-5 sm:w-5" />
                      开始发布
                    </>
                  )}
                </button>

                {registrationsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleDraw(activity)}
                    data-testid={`draw-activity-${activity.id}`}
                    className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-blue-50 px-3 py-3 text-base font-medium text-blue-700 transition-colors hover:bg-blue-100 sm:gap-2 sm:px-4 sm:py-3 sm:text-base"
                  >
                    <Trophy className="h-5 w-5 sm:h-5 sm:w-5" />
                    {hasDrawn ? "重新抽签" : "执行抽签"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void handleDelete(activity)}
                  data-testid={`delete-activity-${activity.id}`}
                  className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-3 text-base font-medium text-red-700 transition-colors hover:bg-red-100 sm:gap-2 sm:px-4 sm:py-3 sm:text-base"
                >
                  <Trash2 className="h-5 w-5 sm:h-5 sm:w-5" />
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
