import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { createTimestampTitle } from "./utils";
import { activityService } from "~/services/activity";
import { deleteAllRegistrations } from "~/services/registration";

interface RegistrationFormData {
  name: string;
  phone: string;
}

// 辅助函数：填写报名表单
async function fillRegistrationForm(page: Page, data: RegistrationFormData) {
  await page.fill('[data-testid="registration-name"]', data.name);
  await page.fill('[data-testid="registration-phone"]', data.phone);
  await page.click('[data-testid="submit-registration"]');

  // 等待成功提示
}

test.describe("抽签功能测试", () => {
  let testActivity: {
    id: string;
    title: string;
  };

  test.beforeEach(async ({ createTestActivity, createTestRegistrants }) => {
    // 创建测试活动
    testActivity = await createTestActivity({
      title: createTimestampTitle("抽奖测试活动"),
      content: "这是一个用于测试抽奖功能的活动",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1天后截止
      winnersCount: 2, // 设置2个中奖名额
      isPublished: true,
    });

    await createTestRegistrants(testActivity.id, 10);
  });

  test.describe("抽签流程", () => {
    test("访问过期活动结果页面自动触发抽签", async ({
      authedPage: page,
      pb,
    }) => {
      // 将活动设置为过期
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await pb.collection("activities").update(testActivity.id, {
        deadline: pastDate.toISOString(),
      });

      // 直接访问结果页面，应该自动触发抽签
      await page.goto(`/activity/${testActivity.id}/result`);

      // 验证抽签结果
      await expect(page.getByText("抽签完成")).toBeVisible();
      await expect(page.getByText("已中签")).toHaveCount(2);
    });

    test("倒计时结束自动触发抽签", async ({ authedPage: page, pb }) => {
      // 将活动设置为即将过期（5秒后）
      const almostExpiredDate = new Date(Date.now() + 5000);
      await pb.collection("activities").update(testActivity.id, {
        deadline: almostExpiredDate.toISOString(),
      });

      // 访问结果页面
      await page.goto(`/activity/${testActivity.id}/result`);

      // 等待6秒，确保倒计时结束并触发抽签
      await page.waitForTimeout(7000);

      // 验证抽签结果
      await expect(page.getByText("抽签完成")).toBeVisible();
      await expect(page.getByText("已中签")).toHaveCount(2);
    });

    test("完整的抽签流程", async ({ authedPage: page, pb }) => {
      // 第一步：添加10个报名者

      // 第二步：将活动设置为过期
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 设置为昨天
      await pb.collection("activities").update(testActivity.id, {
        deadline: pastDate.toISOString(),
      });

      await activityService.drawWinners(testActivity.id);

      // 第四步：查看结果页面
      await page.goto(`/activity/${testActivity.id}/result`);
      await expect(page.getByText("抽签结果已公布")).toBeVisible();
      await expect(page.locator("main")).toContainText("抽签完成");
    });
  });

  test.describe("结果页面显示", () => {
    test("未开奖活动显示等待提示", async ({ authedPage: page }) => {
      await page.goto(`/activity/${testActivity.id}/result`);
      await expect(page.getByText(`报名中`)).toBeVisible();
    });

    test("报名结束但未抽签显示报名结束", async ({ authedPage: page, pb }) => {
      // 将活动设置为过期
      await pb.collection("activities").update(testActivity.id, {
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });

      await page.goto(`/activity/${testActivity.id}/result`);
      await expect(page.getByText("报名结束")).toBeVisible();
    });

    test("无报名活动显示提示信息", async ({ authedPage: page, pb }) => {
      // 将活动设置为过期
      await pb.collection("activities").update(testActivity.id, {
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });
      // 删除所有报名者
      await deleteAllRegistrations(testActivity.id);
      // 重新加载活动

      await page.goto(`/activity/${testActivity.id}/result`);
      await expect(page.getByText("暂无报名")).toBeVisible();
    });

    test("抽签结束显示中签信息", async ({ authedPage: page, pb }) => {
      // 将活动设置为过期
      await pb.collection("activities").update(testActivity.id, {
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });

      await activityService.drawWinners(testActivity.id);

      await page.goto(`/activity/${testActivity.id}/result`);
      await expect(page.getByText("抽签完成")).toBeVisible();
      await expect(page.getByText("已中签")).toHaveCount(2);
    });
  });
});
