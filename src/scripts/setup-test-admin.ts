import PocketBase from "pocketbase";
import * as dotenv from "dotenv";
import { resolve } from "path";
import type { AuthModel } from "~/lib/pb";

// 加载测试环境变量
dotenv.config({ path: resolve(__dirname, "../../.env.test") });

// 基础记录类型
interface BaseRecord {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

// 用户响应类型
interface UserRecord extends BaseRecord, AuthModel {
  email: string;
  username: string;
  verified: boolean;
  role?: string;
  isAdmin?: boolean;
  tokenExpire?: string;
}

async function main() {
  try {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    const username = process.env.TEST_ADMIN_USERNAME;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!username || !password) {
      throw new Error(
        "请在 .env.test 中配置 TEST_ADMIN_USERNAME 和 TEST_ADMIN_PASSWORD",
      );
    }

    // 1. 创建用户
    console.log("正在创建测试管理员账号...");
    const user = await pb.collection("users").create<UserRecord>({
      username,
      password,
      passwordConfirm: password,
      email: `${username}@test.com`,
      role: "admin",
      isAdmin: true,
      emailVisibility: true,
      verified: true,
    });

    console.log("测试管理员账号创建成功:", {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // 2. 验证账号登录
    const authResult = await pb
      .collection("users")
      .authWithPassword(username, password);

    // 设置明确的类型以确保类型安全
    const record: UserRecord = authResult.record as unknown as UserRecord;

    console.log("测试管理员登录验证成功:", {
      token: authResult.token ? "已生成" : "未生成",
      model: {
        id: record.id,
        username: record.username,
        role: record.role ?? "未设置",
        isAdmin: record.isAdmin ?? false,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.toString().includes("already exists")) {
      console.log("测试管理员账号已存在，跳过创建");
      return;
    }
    console.error("创建测试管理员账号失败:", error);
    process.exit(1);
  }
}

main().catch(console.error);
