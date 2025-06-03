import { notFound } from "next/navigation";
import { ResultDisplay } from "./result-display";
import { activityService } from "~/services/activity";

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

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultPage({ params }: Props) {
  try {
    const { id } = await params;
    console.log("Loading result page for activity:", id);

    // 获取活动信息，使用let以便重新赋值
    let activity = await activityService.getActivity(id);
    if (!activity) {
      console.error("Activity not found:", id);
      notFound();
    }

    // 检查活动是否已截止
    const now = new Date();
    const deadline = new Date(activity.deadline);
    const isExpired = now >= deadline;

    // 获取所有报名记录
    const registrations = activity.expand?.registrations ?? [];

    // 如果活动已截止但未抽签，则进行抽签
    if (isExpired && !registrations.some((reg) => reg.isWinner)) {
      await activityService.drawWinners(activity.id);
      // 重新获取活动信息以获取最新抽签结果
      const updatedActivity = await activityService.getActivity(id);
      if (!updatedActivity) {
        console.error("Activity not found after draw:", id);
        notFound();
      }
      activity = updatedActivity;
    }

    // 获取中签者
    const winnerRegistrations = (activity.expand?.registrations ?? []).filter(
      (reg) => reg.isWinner,
    );

    console.log("Page data:", {
      registrationsCount: registrations.length,
      winnersCount: winnerRegistrations.length,
      isExpired,
    });

    return (
      <ResultDisplay
        activity={activity}
        registrations={registrations}
        winners={winnerRegistrations}
        isPending={!isExpired} // 保持原有属性名
        isPublished={activity.isPublished}
      />
    );
  } catch (error) {
    await logError("ResultPage", error);
    throw error; // 让 Next.js 错误边界处理
  }
}
