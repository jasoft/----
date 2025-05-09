import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

export async function POST() {
  if (
    !process.env.POCKETBASE_ADMIN_EMAIL ||
    !process.env.POCKETBASE_ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: "管理员凭据未配置" }, { status: 500 });
  }

  try {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD,
    );

    return NextResponse.json({
      token: pb.authStore.token,
      model: pb.authStore.record,
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json({ error: "认证失败" }, { status: 401 });
  }
}
