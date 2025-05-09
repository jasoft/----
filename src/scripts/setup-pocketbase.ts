import PocketBase from "pocketbase";
import { config } from "dotenv";
config();

// 打印环境变量以便调试
console.log("Admin email:", process.env.POCKETBASE_ADMIN_EMAIL);

async function setupPocketBase() {
  if (
    !process.env.POCKETBASE_ADMIN_EMAIL ||
    !process.env.POCKETBASE_ADMIN_PASSWORD
  ) {
    throw new Error(
      "管理员凭据未配置。请在.env文件中设置 POCKETBASE_ADMIN_EMAIL 和 POCKETBASE_ADMIN_PASSWORD",
    );
  }

  const pb = new PocketBase("http://127.0.0.1:8090");

  try {
    // 创建管理员账号
    console.log("Creating admin account...");
    await pb.admins.create({
      email: process.env.POCKETBASE_ADMIN_EMAIL,
      password: process.env.POCKETBASE_ADMIN_PASSWORD,
      passwordConfirm: process.env.POCKETBASE_ADMIN_PASSWORD,
    });

    // 登录管理员账号
    console.log("Logging in as admin...");
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD,
    );

    // 创建activities集合
    console.log("Creating activities collection...");
    await pb.collections.create({
      name: "activities",
      type: "base",
      schema: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "content",
          type: "text",
          required: true,
        },
        {
          name: "deadline",
          type: "date",
          required: true,
        },
        {
          name: "winnersCount",
          type: "number",
          required: true,
          min: 1,
        },
      ],
      listRule: "true",
      viewRule: "true",
      createRule: "true",
      updateRule: "true",
      deleteRule: "true",
    });

    console.log("Setup completed successfully!");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Setup failed:", error.message);
    } else {
      console.error("Setup failed with unknown error");
    }
    process.exit(1);
  }
}

setupPocketBase().catch((error) => {
  console.error("Fatal error during setup:", error);
  process.exit(1);
});
