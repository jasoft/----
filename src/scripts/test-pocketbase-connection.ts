import PocketBase from "pocketbase";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

async function testPocketBaseConnection() {
  try {
    // 检查环境变量
    const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
    if (!pocketbaseUrl) {
      throw new Error("NEXT_PUBLIC_POCKETBASE_URL 环境变量未设置");
    }

    console.log("PocketBase URL:", pocketbaseUrl);

    const pb = new PocketBase(pocketbaseUrl);

    // 测试基本连接
    console.log("测试基本连接...");
    try {
      const health = await pb.health.check();
      console.log("✓ PocketBase 健康检查通过:", health);
    } catch (error) {
      console.log("✗ PocketBase 健康检查失败:", error);
      return;
    }

    // 测试管理员认证
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL ?? "1188540@qq.com";
    const adminPassword =
      process.env.POCKETBASE_ADMIN_PASSWORD ?? "daSyc1uJ0Sl";

    console.log("测试管理员认证...");
    console.log("管理员邮箱:", adminEmail);

    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log("✓ 管理员认证成功");
      console.log("管理员信息:", pb.authStore.model);
    } catch (error) {
      console.log("✗ 管理员认证失败:", error);
      return;
    }

    // 测试集合访问
    console.log("测试集合访问...");

    try {
      const collections = await pb.collections.getFullList();
      console.log("✓ 获取集合列表成功");
      console.log(
        "现有集合:",
        collections.map((c) => c.name),
      );

      // 检查 user_cache 集合是否存在
      const userCacheCollection = collections.find(
        (c) => c.name === "user_cache",
      );
      if (userCacheCollection) {
        console.log("✓ user_cache 集合已存在");

        // 测试访问 user_cache 集合
        try {
          const records = await pb.collection("user_cache").getList(1, 1);
          console.log("✓ user_cache 集合访问成功");
          console.log("记录数量:", records.totalItems);
        } catch (error) {
          console.log("✗ user_cache 集合访问失败:", error);
        }
      } else {
        console.log("⚠ user_cache 集合不存在，需要手动创建");
        console.log("请参考 docs/setup-user-cache-manual.md 进行手动设置");
      }
    } catch (error) {
      console.log("✗ 获取集合列表失败:", error);
    }

    console.log("\n=== 测试完成 ===");
    console.log("如果所有测试都通过，您可以开始使用认证缓存系统");
  } catch (error) {
    console.error("测试失败:", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  testPocketBaseConnection()
    .then(() => {
      console.log("连接测试完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("测试失败:", error);
      process.exit(1);
    });
}

export { testPocketBaseConnection };
