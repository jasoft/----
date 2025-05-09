import { NextResponse } from "next/server";
import { pb, type Activity, type Registration } from "~/lib/pb";
import { getRandomElements } from "~/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: { id?: string } },
) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: "活动ID不能为空" }, { status: 400 });
    }

    let activity: Activity;
    try {
      activity = await pb.collection("activities").getOne<Activity>(params.id);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    // 检查是否已过截止时间
    const now = new Date();
    const deadline = new Date(activity.deadline);
    if (now < deadline) {
      return NextResponse.json({ error: "活动尚未截止" }, { status: 400 });
    }

    // 获取所有报名者
    const registrations = await pb
      .collection("registrations")
      .getFullList<Registration>({
        filter: `activityId="${params.id}"`,
      });

    if (registrations.length === 0) {
      return NextResponse.json({ error: "没有报名记录" }, { status: 400 });
    }

    if (registrations.length < activity.winnersCount) {
      return NextResponse.json(
        { error: "报名人数少于中签名额" },
        { status: 400 },
      );
    }

    // 随机选择中签者
    const winners = getRandomElements(registrations, activity.winnersCount);

    // 更新中签状态
    await Promise.all([
      // 将所有报名者设置为未中签
      ...registrations.map((registration) =>
        pb.collection("registrations").update<Registration>(registration.id, {
          isWinner: false,
        }),
      ),
      // 更新中签者状态
      ...winners.map((winner) =>
        pb.collection("registrations").update<Registration>(winner.id, {
          isWinner: true,
        }),
      ),
    ]);

    return NextResponse.json({
      success: true,
      winners: winners.map((w) => ({ id: w.id, name: w.name })),
    });
  } catch (error) {
    console.error("Draw error:", error);
    return NextResponse.json({ error: "抽签过程中发生错误" }, { status: 500 });
  }
}
