import {
  test as base,
  expect,
  type Page,
  type TestType,
} from "@playwright/test";
import PocketBase, { ClientResponseError } from "pocketbase";
import { activityService } from "~/services/activity";
import { getPocketBaseClientInstance, type Activity } from "~/lib/pb";
import { clerk } from "@clerk/testing/playwright";
import { fakerZH_CN as faker } from "@faker-js/faker";
import { generateRandomPhoneNumber } from "./utils";

// 每个测试用例的固定装置
export interface TestFixtures {
  page: Page;
  authedPage: Page;
  pb: PocketBase;
  createTestActivity: (data?: Partial<Activity>) => Promise<Activity>;
  deleteTestActivity: (id: string) => Promise<void>;
  createTestRegistrants: (activityId: string, count: number) => Promise<void>;
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
  creatorId: "test-creator-id", // 这里可以替换为实际的测试用户 ID
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

  // 基础页面实例（不带登录状态）
  page: async ({ page }, use) => {
    await use(page);
  },

  // 已登录的页面实例（使用 storageState 自动应用登录状态）
  authedPage: async ({ page }, use) => {
    await use(page);
  },

  // 每个测试用例的 PocketBase 实例
  pb: async ({ workerPb }, use) => {
    await use(workerPb);
  },

  // 创建测试活动的辅助函数
  createTestActivity: async ({ workerPb }, use) => {
    // 存储当前测试创建的活动 ID
    let activity: Activity | null = null;

    const createActivity = async (
      data: Partial<Activity> = {},
    ): Promise<Activity> => {
      // 合并默认数据和传入的数据
      //const user = await currentUser();

      const activityData = {
        ...DEFAULT_TEST_ACTIVITY,
        ...data,
      };

      try {
        const record = await workerPb
          .collection("activities")
          .create<Activity>(activityData);

        // 记录创建的活动 ID
        activity = record;
        return activity;
      } catch (error) {
        console.error("创建测试活动失败:", error);
        throw error;
      }
    };

    await use(createActivity);

    // 测试结束后清理创建的活动
    if (activity) {
      const act = activity as Activity;
      try {
        await activityService.deleteActivity(act.id);
      } catch (error) {
        if (!(error instanceof ClientResponseError)) {
          console.error(`清理测试活动失败 (ID:  ${act.title}  ):`, error);
        }
      }
    }
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
        await workerPb.collection("activities").update(activityId, {
          "+registrations": reg.id,
        });
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

// 导出类型和工具函数
export type Test = TestType<TestFixtures, WorkerFixtures>;
export { test, expect };
