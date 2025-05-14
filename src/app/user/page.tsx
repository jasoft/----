import type { Metadata } from "next";
import { ActivityList } from "~/components/activity-list";
import { activityService } from "~/services/activity";

export const metadata: Metadata = {
  title: "活动列表",
  description: "查看所有可报名的活动",
};

function EmptyState() {
  return (
    <div className="rounded-lg border border-neutral-200 p-8 text-center">
      <p className="text-lg text-neutral-600">暂无活动</p>
      <p className="mt-2 text-sm text-neutral-500">请稍后再来查看</p>
    </div>
  );
}

export default async function UserPage() {
  // 数据获取失败会自动被error.tsx处理
  const activities = await activityService.getActivityList();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">活动列表</h1>
      {activities.length === 0 ? (
        <EmptyState />
      ) : (
        <ActivityList activities={activities} />
      )}
    </div>
  );
}
