"use client";

import { type ReactElement } from "react";
import type { Activity } from "~/lib/pb";
import { formatDate, isExpired, getTimeLeft } from "~/lib/utils";
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

interface ManageActivityCardProps {
  activity: Activity;
  onDelete: (activity: Activity) => void;
  onTogglePublish: (activity: Activity) => void;
  onDraw: (activity: Activity) => void;
  onShare: (activity: Activity) => void;
}

export function ManageActivityCard({
  activity,
  onDelete,
  onTogglePublish,
  onDraw,
  onShare,
}: ManageActivityCardProps): ReactElement {
  const expired = isExpired(activity.deadline);
  const registrations = activity.expand?.registrations ?? [];
  const registrationsCount = registrations.length;
  const hasDrawn = registrations.some((r) => r.isWinner);

  return (
    <div
      data-testid={`activity-${activity.id}`}
      className={`group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
        expired
          ? "border-gray-200 bg-gray-50/30"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* 标题区域 */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 leading-tight">
            {activity.title}
          </h3>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            {activity.isPublished && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                <CheckCircle className="h-3 w-3" />
                已发布
              </span>
            )}
            {hasDrawn && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                <Trophy className="h-3 w-3" />
                已抽签
              </span>
            )}
            {expired && (
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                <XCircle className="h-3 w-3" />
                已结束
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 卡片内容 */}
      <div className="space-y-5 p-6">
        {/* 时间信息 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>截止时间: {formatDate(activity.deadline)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-gray-400" />
            <span
              className={`text-sm font-medium ${expired ? "text-gray-500" : "text-gray-900"}`}
            >
              {getTimeLeft(activity.deadline)}
            </span>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">报名人数</p>
              <p className="text-lg font-semibold text-gray-900">
                {registrationsCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Trophy className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">中签名额</p>
              <p className="text-lg font-semibold text-gray-900">
                {activity.winnersCount}
              </p>
            </div>
          </div>
        </div>

        {/* 报名者列表 */}
        {registrationsCount > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
              报名者 ({registrationsCount}人)
            </p>
            <div className="flex flex-wrap gap-2">
              {registrations.map((reg) => (
                <span
                  key={reg.id}
                  className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 shadow-sm"
                  title={reg.phone}
                >
                  {reg.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            <a
              href={`/activity/${activity.id}/result`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              data-testid={`view-result-${activity.id}`}
            >
              <Eye className="h-4 w-4" />
              查看报名
            </a>

            <button
              type="button"
              onClick={() => onShare(activity)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              data-testid={`share-activity-${activity.id}`}
            >
              <Share2 className="h-4 w-4" />
              分享链接
            </button>

            <a
              href={`/admin/${activity.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              data-testid={`edit-activity-${activity.id}`}
            >
              <Edit className="h-4 w-4" />
              编辑活动
            </a>

            <button
              type="button"
              onClick={() => onTogglePublish(activity)}
              data-testid={`toggle-publish-${activity.id}`}
              className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                activity.isPublished
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {activity.isPublished ? (
                <>
                  <Pause className="h-4 w-4" />
                  停止发布
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  开始发布
                </>
              )}
            </button>

            {registrationsCount > 0 && (
              <button
                type="button"
                onClick={() => onDraw(activity)}
                data-testid={`draw-activity-${activity.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                <Trophy className="h-4 w-4" />
                {hasDrawn ? "重新抽签" : "执行抽签"}
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(activity)}
              data-testid={`delete-activity-${activity.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              删除活动
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
