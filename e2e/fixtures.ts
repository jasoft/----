import {
  test as base,
  expect,
  type Page,
  type TestType,
} from "@playwright/test";
import PocketBase, { ClientResponseError } from "pocketbase";
import type { AuthModel } from "~/lib/pb";

export interface TestActivity {
  id: string;
  title: string;
  content: string;
  deadline: string;
  winnersCount: number;
  maxRegistrants: number;
  created: string;
  updated: string;
  isPublished?: boolean;
}

// 每个测试用例的固定装置
export interface TestFixtures {
  testPage: Page;
  pb: PocketBase;
  createTestActivity: (data?: Partial<TestActivity>) => Promise<TestActivity>;
  deleteTestActivity: (id: string) => Promise<void>;
}

// Worker 级别的固定装置
export interface WorkerFixtures {
  workerPb: PocketBase;
}

// 默认测试活动数据
const DEFAULT_TEST_ACTIVITY = {
  title: `测试活动${Math.floor(Math.random() * 10000)}`,
  content: "这是一个随机生成的测试活动",
  deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  winnersCount: 10,
  maxRegistrants: 100,
  isPublished: true,
};

// 管理员登录信息
const ADMIN_USERNAME = process.env.TEST_ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error(
    "请在 .env.test 文件中配置以下环境变量:\n" +
      "TEST_ADMIN_USERNAME - 管理员用户名\n" +
      "TEST_ADMIN_PASSWORD - 管理员密码\n" +
      "注意：该用户必须具有管理员权限(role=admin)",
  );
}

/* eslint-disable react-hooks/rules-of-hooks */
// 创建测试固定装置
const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker 级别的 PocketBase 实例
  workerPb: [
    async ({}, use) => {
      const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

      try {
        // 使用管理员用户账号登录
        const authData = await pb
          .collection("users")
          .authWithPassword(ADMIN_USERNAME, ADMIN_PASSWORD);

        if (!pb.authStore.isValid) {
          throw new Error("管理员认证失败");
        }

        const model = authData.record as AuthModel;
        console.log("[Fixture] Worker PB 认证成功:", {
          model: {
            id: model.id,
            username: model.username,
            role: model.role,
          },
        });
      } catch (error) {
        console.error("管理员登录失败:", error);
        throw error;
      }

      await use(pb);

      // 清理认证状态
      pb.authStore.clear();
    },
    { scope: "worker" },
  ],

  // 页面实例
  testPage: async ({ page }, use) => {
    // 导航到管理后台前先登录
    await page.goto("/admin/login");

    // 填写登录表单
    await page.fill('input[id="username"]', ADMIN_USERNAME);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // 等待登录成功并跳转
    await page.waitForURL("/admin**");

    await use(page);
  },

  // 每个测试用例的 PocketBase 实例
  pb: async ({ workerPb }, use) => {
    await use(workerPb);
  },

  // 创建测试活动的辅助函数
  createTestActivity: async ({ workerPb }, use) => {
    const createActivity = async (
      data: Partial<TestActivity> = {},
    ): Promise<TestActivity> => {
      // 创建活动时移除 isPublished 字段
      const { isPublished, ...activityData } = {
        ...DEFAULT_TEST_ACTIVITY,
        ...data,
      };

      try {
        const record = await workerPb
          .collection("activities")
          .create<ActivityRecord>(activityData);

        // 转换为 TestActivity 类型
        const testActivity: TestActivity = {
          id: record.id,
          title: record.title,
          content: record.content,
          deadline: record.deadline,
          winnersCount: record.winnersCount,
          maxRegistrants: record.maxRegistrants,
          created: record.created,
          updated: record.updated,
          isPublished: isPublished ?? DEFAULT_TEST_ACTIVITY.isPublished,
        };

        return testActivity;
      } catch (error) {
        console.error("创建测试活动失败:", error);
        throw error;
      }
    };

    await use(createActivity);
  },

  // 删除测试活动的辅助函数
  deleteTestActivity: async ({ workerPb }, use) => {
    const deleteActivity = async (id: string): Promise<void> => {
      try {
        // 先获取与活动关联的所有报名记录
        const registrations = await workerPb
          .collection("registrations")
          .getList(1, 50, {
            filter: `activity="${id}"`,
          });

        // 删除所有关联的报名记录
        for (const registration of registrations.items) {
          await workerPb.collection("registrations").delete(registration.id);
        }

        // 然后删除活动
        await workerPb.collection("activities").delete(id);
      } catch (error) {
        if (!(error instanceof ClientResponseError && error.status === 404)) {
          throw error;
        }
      }
    };

    await use(deleteActivity);
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

// PocketBase 活动记录类型
interface ActivityRecord {
  id: string;
  created: string;
  updated: string;
  title: string;
  content: string;
  deadline: string;
  winnersCount: number;
  maxRegistrants: number;
}

// 导出类型和工具函数
export type Test = TestType<TestFixtures, WorkerFixtures>;
export { test, expect };
