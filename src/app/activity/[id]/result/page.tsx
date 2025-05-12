import { notFound } from "next/navigation";
import { type Activity } from "~/lib/pb";
import { ResultDisplay } from "./result-display";

function validateActivityData(data: unknown): Activity {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid activity data: data is not an object");
  }

  const requiredFields = [
    "id",
    "created",
    "updated",
    "title",
    "content",
    "deadline",
    "winnersCount",
  ] as const;
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(
        `Invalid activity data: missing required field '${field}'`,
      );
    }
  }

  const activity = data as Activity;

  if (
    typeof activity.title !== "string" ||
    typeof activity.content !== "string" ||
    typeof activity.deadline !== "string" ||
    typeof activity.winnersCount !== "number"
  ) {
    throw new Error("Invalid activity data: field type mismatch");
  }

  return activity;
}

async function logError(context: string, error: unknown) {
  console.error(`=== Error in ${context} ===`);
  if (error instanceof Error) {
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);
    if ("cause" in error && error.cause) {
      console.error("Error cause:", error.cause);
    }
  } else {
    console.error("Unknown error:", error);
  }
  console.error("=== End of error ===\n");
}

async function getActivity(activityId: string): Promise<Activity | null> {
  try {
    const url = `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/activities/records/${activityId}?expand=registrations`;
    console.log("Fetching activity:", url);

    const res = await fetch(url, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP Error ${res.status}: ${errorText}`);
    }

    const rawData: unknown = await res.json();
    console.log("Raw activity data:", JSON.stringify(rawData, null, 2));

    const activity = validateActivityData(rawData);
    return activity;
  } catch (error) {
    await logError("getActivity", error);
    return null;
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
    console.log("Loading result page for activity:", id);

    // 获取活动信息
    const activity = await getActivity(id);
    if (!activity) {
      console.error("Activity not found:", id);
      notFound();
    }

    // 计算活动状态
    const now = new Date();
    const deadline = new Date(activity.deadline);
    const isPending = now < deadline;
    console.log("Activity status:", {
      isPending,
      deadline: deadline.toISOString(),
    });

    // 从展开的registrations字段获取报名和中签信息
    const registrations = activity.expand?.registrations ?? [];
    const winners = isPending
      ? []
      : registrations.filter((reg) => reg.isWinner);

    console.log("Page data:", {
      registrationsCount: registrations.length,
      winnersCount: winners.length,
      isPending,
    });

    return (
      <ResultDisplay
        activity={activity}
        registrations={registrations}
        winners={winners}
        isPending={isPending}
      />
    );
  } catch (error) {
    await logError("ResultPage", error);
    throw error; // 让 Next.js 错误边界处理
  }
}
