import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

export async function POST() {
  try {
    // 创建新的 PocketBase 实例用于管理员操作
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    // 使用管理员邮箱登录
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL ?? "1188540@qq.com";
    const adminPassword =
      process.env.POCKETBASE_ADMIN_PASSWORD ?? "daSyc1uJ0Sl";

    console.log("尝试管理员登录:", adminEmail);

    // 使用管理员认证
    await pb.admins.authWithPassword(adminEmail, adminPassword);

    console.log("管理员登录成功");

    // 检查集合是否已存在
    let result;
    try {
      await pb.collections.getOne("user_cache");
      result = { exists: true, message: "user_cache 集合已存在" };
    } catch {
      // 集合不存在，尝试创建
      try {
        const collection = await pb.collections.create({
          name: "user_cache",
          type: "base",
          schema: [
            {
              name: "clerkId",
              type: "text",
              required: true,
              options: {
                min: 1,
                max: 255,
                pattern: "",
              },
            },
            {
              name: "email",
              type: "email",
              required: true,
              options: {
                exceptDomains: [],
                onlyDomains: [],
              },
            },
            {
              name: "firstName",
              type: "text",
              required: false,
              options: {
                min: 0,
                max: 255,
                pattern: "",
              },
            },
            {
              name: "lastName",
              type: "text",
              required: false,
              options: {
                min: 0,
                max: 255,
                pattern: "",
              },
            },
            {
              name: "imageUrl",
              type: "url",
              required: false,
              options: {
                exceptDomains: [],
                onlyDomains: [],
              },
            },
            {
              name: "lastUpdated",
              type: "date",
              required: true,
              options: {
                min: "",
                max: "",
              },
            },
          ],
        });

        result = {
          exists: false,
          created: true,
          message: "user_cache 集合创建成功",
          collectionId: collection.id,
        };
      } catch (createError) {
        throw new Error(
          `创建集合失败: ${createError instanceof Error ? createError.message : "未知错误"}`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("设置用户缓存表失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
        suggestion: "请尝试手动创建集合，参考 docs/setup-user-cache-manual.md",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // 创建新的 PocketBase 实例用于管理员操作
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    // 使用管理员邮箱登录
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL ?? "1188540@qq.com";
    const adminPassword =
      process.env.POCKETBASE_ADMIN_PASSWORD ?? "daSyc1uJ0Sl";

    await pb.admins.authWithPassword(adminEmail, adminPassword);

    // 检查集合状态
    let result;
    try {
      const collection = await pb.collections.getOne("user_cache");

      // 获取记录数量
      const records = await pb.collection("user_cache").getList(1, 1);

      result = {
        exists: true,
        collection: {
          id: collection.id,
          name: collection.name,
          type: collection.type,
        },
        recordCount: records.totalItems,
        message: "user_cache 集合状态正常",
      };
    } catch {
      result = {
        exists: false,
        message: "user_cache 集合不存在",
      };
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
