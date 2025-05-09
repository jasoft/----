"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { type Activity } from "~/lib/pb";
import { ManageActivityList } from "~/components/manage-activity-list";

interface PocketBaseListResponse {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: Activity[];
}

async function getActivities() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/activities/records`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as PocketBaseListResponse;
    return data.items;
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return [];
  }
}

export default function AdminPage() {
  const [activities, setActivities] = useState<Activity[]>([]);

  const loadActivities = useCallback(async () => {
    const items = await getActivities();
    setActivities(items);
  }, []);

  // 初始加载
  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">活动管理</h1>
        <Link href="/admin/new" className="btn btn-primary">
          创建活动
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-lg text-neutral-600">暂无活动</p>
          <p className="mt-2 text-sm text-neutral-500">
            点击右上角按钮创建新活动
          </p>
        </div>
      ) : (
        <ManageActivityList
          activities={activities}
          onDeleted={loadActivities}
        />
      )}
    </main>
  );
}
