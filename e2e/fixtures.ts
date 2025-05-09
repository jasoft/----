import {
  test as base,
  expect,
  type Page,
  type TestType,
} from "@playwright/test";
import PocketBase, { ClientResponseError } from "pocketbase";

export interface TestActivity {
  id: string;
  title: string;
  content: string;
  deadline: string;
  winnersCount: number;
  created: string;
  updated: string;
  isPublished?: boolean; // 设为可选以兼容现有测试
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
  title: "测试活动1",
  content: "这是测试活动1的详细描述",
  deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  winnersCount: 10,
  isPublished: true,
};

/* eslint-disable react-hooks/rules-of-hooks */
// 创建测试固定装置
const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker 级别的 PocketBase 实例
  workerPb: [
    async ({}, use) => {
      const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

      try {
        const email = process.env.POCKETBASE_ADMIN_EMAIL;
        const password = process.env.POCKETBASE_ADMIN_PASSWORD;

        if (!email || !password) {
          throw new Error("管理员凭据未配置，请检查 .env.test 文件");
        }

        await pb.admins.authWithPassword(email, password);

        if (!pb.authStore.isValid) {
          throw new Error("管理员认证失败");
        }
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
  testPage: async ({ page, workerPb }, use) => {
    // 在每个测试开始前执行管理员登录
    const email = process.env.POCKETBASE_ADMIN_EMAIL;
    const password = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("管理员凭据未配置，请检查 .env.test 文件");
    }

    await workerPb.admins.authWithPassword(email, password);

    await page.goto("/admin");
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
}

// 导出类型和工具函数
export type Test = TestType<TestFixtures, WorkerFixtures>;
export { test, expect };
