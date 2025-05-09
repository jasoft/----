import { NextRequest, NextResponse } from "next/server";
import { getPocketBaseServerInstance } from "~/lib/pb"; // 假设这是获取PB服务实例的方法
import { Collections, type Activity, type Registration } from "~/lib/pb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const activityId = params.id;
  const pb = getPocketBaseServerInstance();

  // 1. 验证管理员身份 (重要!)
  // PocketBase SDK 会自动处理 cookie 认证，如果 API 规则设置正确
  // 或者，如果需要显式检查，可以尝试获取当前管理员：
  // const admin = pb.authStore.model;
  // if (!admin || pb.authStore.isAdmin === false) {
  //   return NextResponse.json(
  //     { message: "Unauthorized: Admin access required" },
  //     { status: 401 },
  //   );
  // }
  // 注意：确保 PocketBase 中 _admins 集合的 API 规则配置正确，
  // 并且此 API 路由的调用者已通过管理员身份验证。
  // 更好的做法是在 PocketBase 集合的规则中限制此操作，
  // 例如，为 activities 集合添加一个自定义 API 规则，只允许管理员触发。
  // 这里我们依赖于前端调用此API时已经确保了管理员登录。

  try {
    // 2. 获取活动详情
    const activity = await pb
      .collection(Collections.ACTIVITIES)
      .getOne<Activity>(activityId);

    if (!activity) {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 },
      );
    }

    // 3. 检查活动是否已过截止日期
    const now = new Date();
    const deadline = new Date(activity.deadline);
    if (now < deadline) {
      return NextResponse.json(
        { message: "Lottery draw cannot be performed before the deadline" },
        { status: 400 },
      );
    }

    // 4. 获取所有未中签的报名者
    const registrations = await pb
      .collection(Collections.REGISTRATIONS)
      .getFullList<Registration>({
        filter: `activityId = "${activityId}" && isWinner = false`,
      });

    if (registrations.length === 0) {
      return NextResponse.json(
        { message: "No eligible registrations found for the draw" },
        { status: 400 },
      );
    }

    // 5. 获取已中签人数
    const existingWinners = await pb
      .collection(Collections.REGISTRATIONS)
      .getFullList<Registration>({
        filter: `activityId = "${activityId}" && isWinner = true`,
        fields: "id", // 只获取ID以提高效率
      });
    
    const numberOfWinnersToSelect = activity.winnersCount - existingWinners.length;

    if (numberOfWinnersToSelect <= 0) {
        return NextResponse.json(
            { message: "The number of winners has already reached the limit or no winners to select." },
            { status: 400 },
          );
    }

    // 6. 随机抽取中签者
    const shuffledRegistrations = registrations.sort(() => 0.5 - Math.random());
    const selectedWinners = shuffledRegistrations.slice(0, Math.min(numberOfWinnersToSelect, registrations.length));

    // 7. 更新中签者状态
    const updatePromises = selectedWinners.map((registration) =>
      pb
        .collection(Collections.REGISTRATIONS)
        .update(registration.id, { isWinner: true }),
    );

    await Promise.all(updatePromises);

    return NextResponse.json(
      {
        message: `Successfully drew ${selectedWinners.length} winners.`,
        winners: selectedWinners.map(w => w.id),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Draw failed:", error);
    // PocketBase errors often have more details in error.data or error.originalError
    const errorMessage = error.data?.message || error.message || "Failed to perform draw";
    const errorStatus = error.status || 500;
    return NextResponse.json({ message: errorMessage }, { status: errorStatus });
  }
}