import {
  test as base,
  expect,
  type Page,
  type TestType,
} from "@playwright/test";
import PocketBase, { ClientResponseError } from "pocketbase";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { clerk } from "@clerk/testing/playwright";

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
  page: Page;
  authedPage: Page;
  pb: PocketBase;
  createTestActivity: (data?: Partial<TestActivity>) => Promise<TestActivity>;
  deleteTestActivity: (id: string) => Promise<void>;
  login: (page: Page) => Promise<void>;
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

// 测试用户登录信息
const TEST_USER_NAME = process.env.TEST_USER_NAME;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!TEST_USER_NAME || !TEST_USER_PASSWORD) {
  throw new Error(
    "请在 .env.test 文件中配置以下环境变量:\n" +
      "TEST_USER_NAME - 测试用户邮箱\n" +
      "TEST_USER_PASSWORD - 测试用户密码",
  );
}

/* eslint-disable react-hooks/rules-of-hooks */
// 创建测试固定装置
const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker 级别的 PocketBase 实例
  workerPb: [
    async ({}, use) => {
      const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
      await use(pb);
    },
    { scope: "worker" },
  ],

  // 登录辅助函数
  login: async ({}, use) => {
    const loginHelper = async (page: Page) => {
      await setupClerkTestingToken({ page });
      await page.goto("/sign-in");
      await clerk.signIn({
        page,
        signInParams: {
          strategy: "password",
          password: TEST_USER_PASSWORD,
          identifier: TEST_USER_NAME,
        },
      });
    };
    await use(loginHelper);
  },

  // 基础页面实例（不带登录状态）
  page: async ({ page }, use) => {
    await use(page);
  },

  // 已登录的页面实例
  authedPage: async ({ page, login }, use) => {
    await login(page);
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
