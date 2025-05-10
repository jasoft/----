"use client";

import type { Activity } from "~/lib/pb";
import { formatDate, isExpired, getTimeLeft } from "~/lib/utils";

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const expired = isExpired(activity.deadline);
  const registrationsCount = activity.expand?.registrations_count ?? 0;

  return (
    <div
      data-testid={`activity-${activity.id}`}
      className={`card shadow-xl ${expired ? "bg-neutral-100" : "bg-base-100"}`}
    >
      <div className="card-body">
        <h2 className="card-title">{activity.title}</h2>
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
        <p className="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">
          {activity.content}
        </p>
        <div className="card-actions flex-wrap items-center">
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
          <div className="ml-auto">
            <a
              href={`/activity/${activity.id}/${expired ? "result" : "register"}`}
              className={`btn btn-sm ${
                expired ? "btn-neutral" : "btn-primary"
              }`}
            >
              {expired ? "查看结果" : "立即报名"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
