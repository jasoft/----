import { type Activity } from "~/lib/pb";
import { ActivityList } from "~/components/activity-list";

export const dynamic = "force-dynamic";

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

export default async function HomePage() {
  const activities = await getActivities();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">活动列表</h1>
      {activities.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-lg text-neutral-600">暂无活动</p>
          <p className="mt-2 text-sm text-neutral-500">
            请访问管理后台创建新活动
          </p>
        </div>
      ) : (
        <ActivityList activities={activities} />
      )}
    </main>
  );
}
