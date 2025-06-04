import PocketBase from "pocketbase";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

async function setupUserCache() {
  try {
    // 检查环境变量
    const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
    if (!pocketbaseUrl) {
      throw new Error("NEXT_PUBLIC_POCKETBASE_URL 环境变量未设置");
    }

    console.log("PocketBase URL:", pocketbaseUrl);

    const pb = new PocketBase(pocketbaseUrl);

    // 使用管理员邮箱登录
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL ?? "1188540@qq.com";
    const adminPassword =
      process.env.POCKETBASE_ADMIN_PASSWORD ?? "daSyc1uJ0Sl";

    console.log("尝试登录管理员:", adminEmail);

    await pb.admins.authWithPassword(adminEmail, adminPassword);

    console.log("已登录 PocketBase 管理员");

    // 检查 user_cache 集合是否已存在
    try {
      await pb.collections.getOne("user_cache");
      console.log("user_cache 集合已存在");
      return;
    } catch {
      console.log("user_cache 集合不存在，开始创建...");
    }

    // 创建 user_cache 集合
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
      indexes: [
        "CREATE UNIQUE INDEX idx_user_cache_clerk_id ON user_cache (clerkId)",
        "CREATE INDEX idx_user_cache_last_updated ON user_cache (lastUpdated)",
      ],
    });

    console.log("user_cache 集合创建成功:", collection.id);

    // 设置集合权限（可选）
    await pb.collections.update(collection.id, {
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    });

    console.log("user_cache 集合权限设置完成");
  } catch (error) {
    console.error("设置 user_cache 集合失败:", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  setupUserCache()
    .then(() => {
      console.log("用户缓存设置完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("设置失败:", error);
      process.exit(1);
    });
}

export { setupUserCache };
