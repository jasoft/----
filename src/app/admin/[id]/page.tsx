import { notFound } from "next/navigation";
import type { Activity } from "~/lib/pb";
import { ActivityContainer } from "../activity-container";

async function getActivity(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/activities/records/${id}`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as Activity;
  } catch (error) {
    console.error("获取活动失败:", error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ActivityManagePage({ params }: PageProps) {
  // 确保先解析params
  const { id } = await params;
  const activity = await getActivity(id);

  if (!activity) {
    notFound();
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <ActivityContainer mode="edit" activity={activity} />
    </main>
  );
}
