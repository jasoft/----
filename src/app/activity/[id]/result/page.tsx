import { notFound } from "next/navigation";
import { type Activity, type Registration } from "~/lib/pb";
import { ResultDisplay } from "./result-display";

interface PocketBaseListResponse<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

async function getActivity(activityId: string): Promise<Activity | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/activities/records/${activityId}`,
      {
        cache: "no-store",
        next: { revalidate: 0 }, // 禁用缓存
      },
    );

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      console.error(`获取活动信息失败: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as unknown;

    if (!data || typeof data !== "object" || !("id" in data)) {
      console.error("获取到的活动数据格式无效");
      return null;
    }

    return data as Activity;
  } catch (error) {
    console.error("获取活动信息时发生错误:", error);
    return null;
  }
}

async function getRegistrations(activityId: string): Promise<Registration[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/registrations/records?filter=(activity="${activityId}")`,
      {
        cache: "no-store",
        next: { revalidate: 0 }, // 禁用缓存
      },
    );

    if (!res.ok) {
      console.error(`获取报名信息失败: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as PocketBaseListResponse<Registration>;

    if (!data || !Array.isArray(data.items)) {
      console.error("获取到的报名数据格式无效");
      return [];
    }

    return data.items;
  } catch (error) {
    console.error("获取报名信息时发生错误:", error);
    return [];
  }
}

async function getWinners(activityId: string): Promise<Registration[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/registrations/records?filter=(activity="${activityId}" && isWinner=true)`,
      {
        cache: "no-store",
        next: { revalidate: 0 }, // 禁用缓存
      },
    );

    if (!res.ok) {
      console.error(`获取中签名单失败: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as PocketBaseListResponse<Registration>;

    if (!data || !Array.isArray(data.items)) {
      console.error("获取到的中签数据格式无效");
      return [];
    }

    return data.items;
  } catch (error) {
    console.error("获取中签名单时发生错误:", error);
    return [];
  }
}

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultPage({ params }: Props) {
  try {
    const { id } = await params;

    // 获取活动信息
    const activity = await getActivity(id);
    if (!activity) {
      notFound();
    }

    // 计算活动状态
    const now = new Date();
    const deadline = new Date(activity.deadline);
    const isPending = now < deadline;

    // 获取报名和中签信息
    const [registrations, winners] = await Promise.all([
      getRegistrations(id),
      isPending ? Promise.resolve([]) : getWinners(id),
    ]);

    // 如果没有任何报名信息，检查活动是否存在
    if (!registrations.length) {
      console.log("当前活动暂无报名信息");
    }

    return (
      <ResultDisplay
        activity={activity}
        registrations={registrations}
        winners={winners}
        isPending={isPending}
      />
    );
  } catch (error) {
    console.error("页面加载时发生错误:", error);
    throw error; // 让 Next.js 错误边界处理
  }
}
