"use client";

import type { Activity } from "~/lib/pb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { formatDate, isExpired } from "~/lib/utils";
import { Dialog } from "~/components/ui/dialog";
import { activityService } from "~/services/activity";

interface ActivityListProps {
  activities: Activity[];
  onDeleted?: () => void;
}

export function ActivityList({ activities, onDeleted }: ActivityListProps) {
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

  return (
    <div
      data-testid="activity-list"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {activities.map((activity) => (
        <Card key={activity.id} data-testid={`activity-${activity.id}`}>
          <CardHeader>
            <CardTitle>{activity.title}</CardTitle>
            <CardDescription>
              截止时间: {formatDate(activity.deadline)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">
              {activity.content}
            </p>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-1 text-sm text-neutral-500">
              <span>👥 中签名额: {activity.winnersCount}人</span>
            </p>
            <div className="ml-auto flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleDelete(activity)}
                data-testid={`delete-activity-${activity.id}`}
              >
                删除
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <a href={`/activity/${activity.id}/result`}>查看报名</a>
              </Button>
              {isExpired(activity.deadline) ? (
                <Button variant="secondary" size="sm" asChild>
                  <a href={`/activity/${activity.id}/result`}>查看结果</a>
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <a href={`/activity/${activity.id}/register`}>立即报名</a>
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
