import Link from "next/link";
import type { Activity } from "~/lib/pb";
import { formatDate, isExpired } from "~/lib/utils";
import { ActivityCountdown } from "./activity-countdown";

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const expired = isExpired(activity.deadline);
  const registrationsCount = activity.expand?.registrations?.length ?? 0;
  const isFull = registrationsCount >= (activity.maxRegistrants ?? Infinity);

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
          <ActivityCountdown
            deadline={activity.deadline}
            className={`text-sm ${
              expired ? "text-neutral-500" : "text-primary"
            }`}
          />
        </div>
        <p className="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">
          {activity.content}
        </p>
        <div className="card-actions flex-wrap items-center">
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <span>👥</span>
              <span>
                已报名: {registrationsCount}
                {activity.maxRegistrants ? `/${activity.maxRegistrants}` : ""}人
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span>🎯</span>
              <span>中签名额: {activity.winnersCount}人</span>
            </span>
          </div>
          <div className="ml-auto space-x-2">
            <Link
              href={`/activity/${activity.id}/result`}
              className="btn btn-sm btn-outline"
            >
              {expired ? "查看结果" : "查看报名"}
            </Link>
            {!expired && (
              <Link
                href={`/activity/${activity.id}/register`}
                className={`btn btn-sm ${
                  isFull ? "btn-disabled" : "btn-primary"
                }`}
              >
                {isFull ? "报名已满" : "立即报名"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
