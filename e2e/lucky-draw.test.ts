import { test, expect, type TestActivity } from "./fixtures";
import type { Page } from "@playwright/test";

interface QueryFormData {
  name: string;
  phone: string;
}

// 辅助函数：填写查询表单
async function fillQueryForm(page: Page, data: QueryFormData) {
  await page.fill('[data-testid="query-name"]', data.name);
  await page.fill('[data-testid="query-phone"]', data.phone);
}

// 辅助函数：等待并确认抽签结果显示
async function waitForDrawResult(page: Page) {
  await expect(page.locator('[data-testid="draw-result-dialog"]')).toBeVisible({
    timeout: 10000,
  });
  await expect(page.locator('[data-testid="draw-result-title"]')).toHaveText(
    "抽签结果已公布",
  );
}

test.describe("抽签结果测试", () => {
  let testActivity: TestActivity;
  const TEST_REGISTRATIONS = [
    { name: "测试用户1", phone: "13800138001" },
    { name: "测试用户2", phone: "13800138002" },
    { name: "测试用户3", phone: "13800138003" },
    { name: "测试用户4", phone: "13800138004" },
  ];

  test.beforeEach(async ({ createTestActivity, pb }) => {
    // 创建测试活动
    testActivity = await createTestActivity({
      title: `抽签测试活动-${Date.now()}`,
      content: "这是一个用于测试抽签功能的活动",
      deadline: new Date(Date.now() - 60000).toISOString(), // 设置为1分钟前截止
      winnersCount: 2,
      isPublished: true,
    });

    // 批量创建报名记录
    for (const reg of TEST_REGISTRATIONS) {
      await pb.collection("registrations").create({
        activity: testActivity.id,
        name: reg.name,
        phone: reg.phone,
      });
    }

    // 等待数据写入
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  test.afterEach(async ({ deleteTestActivity, pb }) => {
    // 删除所有相关的报名记录
    try {
      const registrations = await pb
        .collection("registrations")
        .getFullList({ filter: `activity="${testActivity.id}"` });

      for (const reg of registrations) {
        await pb.collection("registrations").delete(reg.id);
      }
    } catch {
      // 忽略删除错误
    }

    // 删除测试活动
    if (testActivity?.id) {
      await deleteTestActivity(testActivity.id);
    }
  });

  test.describe("执行抽签", () => {
    test("成功执行抽签并显示结果", async ({ testPage }) => {
      await testPage.goto(`/activity/${testActivity.id}/result`);

      // 点击抽签按钮
      await testPage.click('[data-testid="start-draw"]');

      // 等待并验证抽签结果
      await waitForDrawResult(testPage);
      await testPage.click('[data-testid="confirm-draw"]');

      // 验证结果显示
      const resultTable = testPage.locator('[data-testid="result-table"]');
      await expect(resultTable).toBeVisible();

      // 验证中签人数
      const winners = testPage.locator('[data-testid="winner-row"]');
      await expect(winners).toHaveCount(2);
    });

    test("显示正确的统计信息", async ({ testPage }) => {
      await testPage.goto(`/activity/${testActivity.id}/result`);

      // 验证统计信息
      await expect(
        testPage.locator('[data-testid="total-count"]'),
      ).toContainText("4");
      await expect(
        testPage.locator('[data-testid="winners-count"]'),
      ).toContainText("2");
      await expect(testPage.locator('[data-testid="win-rate"]')).toContainText(
        "50%",
      );
    });
  });

  test.describe("结果查询", () => {
    test("用户查询自己的中签结果", async ({ testPage }) => {
      await testPage.goto(`/activity/${testActivity.id}/result`);

      await fillQueryForm(testPage, {
        name: "测试用户1",
        phone: "13800138001",
      });

      await testPage.click('[data-testid="query-submit"]');

      // 验证查询结果显示
      const resultText = await testPage
        .locator('[data-testid="query-result"]')
        .textContent();
      expect(resultText).toMatch(/(已中签|未中签)/);
    });

    test("查询不存在的报名记录", async ({ testPage }) => {
      await testPage.goto(`/activity/${testActivity.id}/result`);

      await fillQueryForm(testPage, {
        name: "不存在用户",
        phone: "13900000000",
      });

      await testPage.click('[data-testid="query-submit"]');

      // 验证错误提示
      await expect(
        testPage.locator('[data-testid="error-dialog"]'),
      ).toBeVisible();
      await expect(testPage.locator('[data-testid="error-title"]')).toHaveText(
        "查询失败",
      );
      await expect(
        testPage.locator('[data-testid="error-message"]'),
      ).toContainText("未找到报名记录");
    });
  });

  test.describe("结果保护", () => {
    test("未开奖活动应该显示等待提示", async ({
      createTestActivity,
      deleteTestActivity,
      testPage,
    }) => {
      // 创建一个新的未开奖活动
      const newActivity = await createTestActivity({
        title: "未开奖活动",
        content: "这是一个未开奖的活动",
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        winnersCount: 2,
        isPublished: true,
      });

      await testPage.goto(`/activity/${newActivity.id}/result`);

      // 验证等待提示
      await expect(
        testPage.locator('[data-testid="waiting-message"]'),
      ).toBeVisible();
      await expect(
        testPage.locator('[data-testid="start-draw"]'),
      ).toBeDisabled();

      // 清理测试数据
      await deleteTestActivity(newActivity.id);
    });
  });
});
