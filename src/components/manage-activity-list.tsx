"use client";

import { type ReactElement } from "react";
import type { Activity } from "~/lib/pb";
import { Dialog } from "~/components/ui/dialog";
import { useToast } from "~/components/ui/toast";
import { useClientUrl } from "~/hooks/use-client-url";
import { activityService } from "~/services/activity";
import { ManageActivityCard } from "~/components/manage-activity-card";
import { isExpired } from "~/lib/utils";

interface ManageActivityListProps {
  activities: Activity[];
  onDeleted?: (forceRefresh?: boolean) => void;
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
        // 删除成功后强制刷新，确保界面更新
        onDeleted?.(true);
      } catch (error) {
        console.error("Delete activity error:", error);

        // 特殊处理 ClientResponseError
        if (error && typeof error === "object" && "status" in error) {
          const clientError = error as { status: number; message?: string };
          if (clientError.status === 404) {
            // 如果活动已经不存在，也算删除成功
            showToast(`活动"${activity.title}"已删除`, "success");
            // 删除成功后强制刷新，确保界面更新
            onDeleted?.(true);
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
      // 状态更新后强制刷新，确保界面更新
      onDeleted?.(true);
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
      // 抽签完成后强制刷新，确保界面更新
      onDeleted?.(true);

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
      {activities.map((activity) => (
        <ManageActivityCard
          key={activity.id}
          activity={activity}
          onDelete={handleDelete}
          onTogglePublish={handleTogglePublish}
          onDraw={handleDraw}
          onShare={handleShare}
        />
      ))}

      {activities.length === 0 && (
        <div className="col-span-full rounded-lg bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">暂无活动数据</p>
        </div>
      )}
    </div>
  );
}
