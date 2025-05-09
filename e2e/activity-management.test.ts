import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

interface ActivityFormData {
  title: string;
  content: string;
  deadline?: Date;
  winnersCount?: string;
}

// 辅助函数：填写活动表单
async function fillActivityForm(page: Page, data: ActivityFormData) {
  await page.fill('[data-testid="activity-title"]', data.title);
  await page.fill('[data-testid="activity-content"]', data.content);
  await page.fill(
    '[data-testid="activity-deadline"]',
    (data.deadline ?? new Date(Date.now() + 24 * 60 * 60 * 1000))
      .toISOString()
      .slice(0, 16),
  );
  await page.fill(
    '[data-testid="activity-winners-count"]',
    data.winnersCount ?? "20",
  );
}

test.describe("活动管理测试", () => {
  test.describe("创建活动", () => {
    test.beforeEach(async ({ testPage }) => {
      await testPage.goto("/admin/new");
      // 等待页面加载完成
      await expect(
        testPage.locator('[data-testid="activity-form"]'),
      ).toBeVisible();
    });

    test("成功创建活动", async ({ testPage }) => {
      const testTitle = `测试活动-${Date.now()}`;
      const testContent = "这是一个测试活动的详细描述";

      await fillActivityForm(testPage, {
        title: testTitle,
        content: testContent,
      });

      // 点击提交并等待网络请求完成
      await Promise.all([
        testPage.waitForResponse(
          (response) =>
            response.url().includes("/api") && response.status() === 200,
        ),
        testPage.click('button[type="submit"]'),
      ]);

      // 验证活动显示在列表中
      await expect(testPage.locator("main")).toContainText(testTitle);
      await expect(testPage.locator("main")).toContainText(testContent);
    });

    test("表单验证 - 必填字段", async ({ testPage }) => {
      await testPage.click('button[type="submit"]');

      // 等待并验证所有错误提示
      const errorMessages = [
        "活动标题不能为空",
        "活动描述不能为空",
        "截止时间不能为空",
        "中签人数不能为空",
      ];

      for (const message of errorMessages) {
        await expect(testPage.locator(`text="${message}"`)).toBeVisible();
      }
    });

    test("表单验证 - 过期时间", async ({ testPage }) => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      await fillActivityForm(testPage, {
        title: "测试活动",
        content: "测试内容",
        deadline: pastDate,
      });

      await testPage.click('button[type="submit"]');

      await expect(
        testPage.locator('text="截止时间必须是未来时间"'),
      ).toBeVisible();
    });
  });

  test.describe("修改活动", () => {
    test("成功修改活动信息", async ({
      testPage,
      createTestActivity,
      deleteTestActivity,
    }) => {
      // 使用 fixture 创建测试活动
      const activity = await createTestActivity();

      // 访问编辑页面
      await testPage.goto(`/admin/${activity.id}/edit`);
      await expect(
        testPage.locator('[data-testid="activity-form"]'),
      ).toBeVisible();

      const updatedTitle = `已修改-${activity.title}`;
      const updatedContent = "这是更新后的内容";

      await fillActivityForm(testPage, {
        title: updatedTitle,
        content: updatedContent,
      });

      await testPage.click('button[type="submit"]');

      // 验证成功提示
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText("活动更新成功");
      await testPage.click(".swal2-confirm");

      // 验证更新结果
      await testPage.goto("/admin");
      await expect(testPage.locator("main")).toContainText(updatedTitle);
      await expect(testPage.locator("main")).toContainText(updatedContent);

      // 清理测试数据
      await deleteTestActivity(activity.id);
    });
  });

  test.describe("删除活动", () => {
    test("成功删除活动", async ({ testPage, createTestActivity }) => {
      // 使用 fixture 创建测试活动
      const activity = await createTestActivity();

      await testPage.goto("/admin");
      await testPage.click(`a:has-text("${activity.title}")`);

      // 验证删除按钮的存在和可点击性
      const deleteButton = testPage.locator('[data-testid="delete-activity"]');
      await expect(deleteButton).toBeVisible();
      await expect(deleteButton).toBeEnabled();

      // 点击删除按钮
      await deleteButton.click();

      // 验证确认对话框的显示和内容
      const dialog = testPage.locator(".swal2-popup");
      const dialogTitle = testPage.locator(".swal2-title");
      const dialogContent = testPage.locator(".swal2-html-container");

      await expect(dialog).toBeVisible();
      await expect(dialogTitle).toContainText("确认删除");
      await expect(dialogContent).toContainText("确定要删除这个活动吗？");

      // 点击确认按钮
      await testPage.click(".swal2-confirm");

      // 等待删除操作完成
      await testPage.waitForResponse(
        (response) =>
          response.url().includes("/api") && response.status() === 200,
      );

      // 验证成功提示
      await expect(dialog).toBeVisible();
      await expect(dialogTitle).toContainText("删除成功");

      await testPage.click(".swal2-confirm");

      // 验证活动列表更新
      await testPage.goto("/admin");
      await expect(testPage.locator("main")).not.toContainText(activity.title);
    });

    test("取消删除活动", async ({
      testPage,
      createTestActivity,
      deleteTestActivity,
    }) => {
      // 使用 fixture 创建测试活动
      const activity = await createTestActivity();

      await testPage.goto("/admin");
      await testPage.click(`a:has-text("${activity.title}")`);

      // 验证删除按钮的存在和可点击性
      const deleteButton = testPage.locator('[data-testid="delete-activity"]');
      await expect(deleteButton).toBeVisible();
      await expect(deleteButton).toBeEnabled();

      // 点击删除按钮
      await deleteButton.click();

      // 验证确认对话框的显示和内容
      const dialog = testPage.locator(".swal2-popup");
      await expect(dialog).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toContainText("确认删除");

      // 点击取消按钮
      await testPage.click(".swal2-cancel");

      // 验证对话框已关闭
      await expect(dialog).not.toBeVisible();

      // 验证活动仍然存在
      await testPage.goto("/admin");
      await expect(testPage.locator("main")).toContainText(activity.title);

      // 清理测试数据
      await deleteTestActivity(activity.id);
    });
  });

  test.describe("活动列表", () => {
    test("应显示活动列表和分页", async ({
      testPage,
      createTestActivity,
      deleteTestActivity,
    }) => {
      // 创建测试活动
      const activity = await createTestActivity();

      await testPage.goto("/admin");

      // 验证页面标题和列表
      await expect(testPage.locator("h1")).toContainText("活动管理");
      await expect(
        testPage.locator('[data-testid="activity-list"]'),
      ).toBeVisible();

      // 验证活动显示
      await expect(
        testPage.locator(`a:has-text("${activity.title}")`),
      ).toBeVisible();

      // 清理测试数据
      await deleteTestActivity(activity.id);
    });
  });
});
