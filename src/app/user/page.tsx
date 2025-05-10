"use client";

import { useState, useEffect } from "react";
import { ActivityList } from "~/components/activity-list";
import { activityService } from "~/services/activity";
import type { Activity } from "~/lib/pb";

export default function UserPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const items = await activityService.getActivityList();
        setActivities(items);
        setError(null);
      } catch (err) {
        console.error("Failed to load activities:", err);
        setError(err instanceof Error ? err.message : "加载活动列表失败");
      } finally {
        setIsLoading(false);
      }
    };

    void loadActivities();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">活动列表</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <span className="ml-3 text-neutral-600">加载中...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-center text-red-600">{error}</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-lg text-neutral-600">暂无活动</p>
          <p className="mt-2 text-sm text-neutral-500">请稍后再来查看</p>
        </div>
      ) : (
        <ActivityList activities={activities} />
      )}
    </main>
  );
}
