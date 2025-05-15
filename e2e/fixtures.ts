import {
  test as base,
  expect,
  type Page,
  type TestType,
} from "@playwright/test";
import PocketBase, { ClientResponseError } from "pocketbase";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { clerk } from "@clerk/testing/playwright";
import { activityService } from "~/services/activity";
import { getPocketBaseClientInstance } from "~/lib/pb";

import { fakerZH_CN as faker } from "@faker-js/faker";
import { generateRandomPhoneNumber } from "./utils";

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
  createTestRegistrants: (activityId: string, count: number) => Promise<void>;
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
      const pb = getPocketBaseClientInstance();
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
    //await login(page);
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
      // 合并默认数据和传入的数据
      const activityData = {
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
          isPublished: record.isPublished,
        };

        return testActivity;
      } catch (error) {
        console.error("创建测试活动失败:", error);
        throw error;
      }
    };

    await use(createActivity);
  },

  createTestRegistrants: async ({ workerPb }, use) => {
    const createRegistrants = async (
      activityId: string,
      count: number,
    ): Promise<void> => {
      const registrants = Array.from({ length: count }, (_, index) => ({
        name: faker.person.fullName(),
        phone: generateRandomPhoneNumber(),
        activity: activityId,
        isWinner: false,
      }));

      for (const registrant of registrants) {
        const reg = await workerPb
          .collection("registrations")
          .create(registrant);
        // 更新活动的报名者列表
        const act = await workerPb.collection("activities").update(activityId, {
          "+registrations": reg.id,
        });
        // 可以添加一个短暂的延迟来确保数据库操作完成
        console.log(act, "活动更新成功");
      }
    };
    await use(createRegistrants);
  },

  // 删除测试活动的辅助函数
  deleteTestActivity: async ({ workerPb }, use) => {
    const deleteActivity = async (id: string): Promise<void> => {
      try {
        // 然后删除活动
        await activityService.deleteActivity(id);
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
  isPublished: boolean;
}

// 导出类型和工具函数
export type Test = TestType<TestFixtures, WorkerFixtures>;
export { test, expect };
