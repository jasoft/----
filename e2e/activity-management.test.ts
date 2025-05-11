import { test, expect, type Test } from "./fixtures";
import type { Page } from "@playwright/test";

interface ActivityFormData {
  title: string;
  content: string;
  deadline?: Date;
  winnersCount?: string;
  maxRegistrants?: string;
}

// 辅助函数：填写活动表单
async function fillActivityForm(page: Page, data: ActivityFormData) {
  await page.fill('[data-testid="activity-title"]', data.title);
  await page.fill('[data-testid="activity-content"]', data.content);

  // 处理截止时间
  const now = new Date();
  const defaultDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const deadline = data.deadline ?? defaultDeadline;
  const timezoneOffset = now.getTimezoneOffset() * 60000; // 转换为毫秒
  const localDeadline = new Date(deadline.getTime() - timezoneOffset);
  const deadlineString = localDeadline.toISOString().slice(0, 16);

  await page.fill('[data-testid="activity-deadline"]', deadlineString);

  if (data.winnersCount !== undefined) {
    await page.fill(
      '[data-testid="activity-winners-count"]',
      data.winnersCount,
    );
  }
  if (data.maxRegistrants !== undefined) {
    await page.fill(
      '[data-testid="activity-max-registrants"]',
      data.maxRegistrants,
    );
  }
}

test.describe("活动管理测试", () => {
  test.describe("创建活动", () => {
    test.beforeEach(async ({ testPage: page }) => {
      await page.goto("/admin/new");
      await expect(page.locator('[data-testid="activity-form"]')).toBeVisible();
    });

    test.afterEach(async ({ testPage: page }) => {
      await page.goto("/admin/logout");
    });

    test("成功创建活动", async ({ testPage: page }) => {
      const testTitle = `测试活动-${Date.now()}`;
      const testContent = "这是一个测试活动的详细描述";

      await fillActivityForm(page, {
        title: testTitle,
        content: testContent,
        winnersCount: "20",
        maxRegistrants: "100",
      });

      // 点击提交并等待导航
      await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]'),
      ]);

      // 验证活动显示在列表中
      await expect(page.locator("main")).toContainText(testTitle);
      await expect(page.locator("main")).toContainText(testContent);
    });

    test("表单验证 - 空字段", async ({ testPage: page }) => {
      await page.click('button[type="submit"]');

      // 等待并验证所有错误提示
      await expect(page.locator('[data-testid="error-title"]')).toContainText(
        "活动标题不能为空",
      );
      await expect(page.locator('[data-testid="error-content"]')).toContainText(
        "活动描述不能为空",
      );
      await expect(
        page.locator('[data-testid="error-winners-count"]'),
      ).toContainText("中签人数不能为空");
      await expect(
        page.locator('[data-testid="error-max-registrants"]'),
      ).toContainText("最大报名人数不能为空");
    });

    test("表单验证 - 过期时间", async ({ testPage: page }) => {
      // 创建一个过去的时间（当前时间前1小时）
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      await fillActivityForm(page, {
        title: "测试活动",
        content: "测试内容",
        deadline: pastDate,
        winnersCount: "20",
      });

      await page.click('button[type="submit"]');

      await expect(
        page.locator('[data-testid="error-deadline"]'),
      ).toContainText("截止时间必须是未来时间");
    });

    test("表单验证 - 最大报名人数限制", async ({ testPage: page }) => {
      // 测试小于1的情况
      await fillActivityForm(page, {
        title: "测试活动",
        content: "测试内容",
        winnersCount: "10",
        maxRegistrants: "0",
      });
      await page.click('button[type="submit"]');
      await expect(
        page.locator('[data-testid="error-max-registrants"]'),
      ).toContainText("最大报名人数不能小于1");

      // 测试大于10000的情况
      await fillActivityForm(page, {
        title: "测试活动",
        content: "测试内容",
        winnersCount: "10",
        maxRegistrants: "10001",
      });
      await page.click('button[type="submit"]');
      await expect(
        page.locator('[data-testid="error-max-registrants"]'),
      ).toContainText("最大报名人数不能超过10000人");

      // 测试小于中签人数的情况
      await fillActivityForm(page, {
        title: "测试活动",
        content: "测试内容",
        winnersCount: "150",
        maxRegistrants: "100",
      });
      await page.click('button[type="submit"]');
      await expect(
        page.locator('[data-testid="error-max-registrants"]'),
      ).toContainText("最大报名人数必须大于或等于中签人数");
    });

    test("表单验证 - 中签人数限制", async ({ testPage: page }) => {
      // 测试小于1的情况
      await fillActivityForm(page, {
        title: "测试活动",
        content: "测试内容",
        winnersCount: "0",
      });
      await page.click('button[type="submit"]');
      await expect(
        page.locator('[data-testid="error-winners-count"]'),
      ).toContainText("中签人数不能小于1");

      // 测试大于1000的情况
      await fillActivityForm(page, {
        title: "测试活动",
        content: "测试内容",
        winnersCount: "1001",
      });
      await page.click('button[type="submit"]');
      await expect(
        page.locator('[data-testid="error-winners-count"]'),
      ).toContainText("中签人数不能超过1000人");

      // 测试不填写的情况
      await fillActivityForm(page, {
        title: "测试活动",
        content: "测试内容",
        winnersCount: "",
      });
      await page.click('button[type="submit"]');
      await expect(
        page.locator('[data-testid="error-winners-count"]'),
      ).toContainText("中签人数不能为空");
    });
  });

  test.describe("修改活动", () => {
    test("成功修改活动信息", async ({
      testPage: page,
      createTestActivity,
      deleteTestActivity,
    }) => {
      // 使用 fixture 创建测试活动
      const activity = await createTestActivity();

      // 访问编辑页面
      await page.goto(`/admin/${activity.id}`);
      await expect(page.locator('[data-testid="activity-form"]')).toBeVisible();

      const updatedTitle = `已修改-${activity.title}`;
      const updatedContent = "这是更新后的内容";

      await fillActivityForm(page, {
        title: updatedTitle,
        content: updatedContent,
        winnersCount: "30",
        maxRegistrants: "100",
      });

      // 提交并等待导航
      await Promise.all([page.click('button[type="submit"]')]);

      // 验证更新结果
      await expect(page.locator("main")).toContainText(updatedTitle);
      await expect(page.locator("main")).toContainText(updatedContent);

      // 清理测试数据
      await deleteTestActivity(activity.id);
    });
  });

  test.describe("删除活动", () => {
    test("成功删除活动", async ({ testPage: page, createTestActivity }) => {
      // 使用 fixture 创建测试活动
      const activity = await createTestActivity();
      await page.goto("/admin");

      // 验证删除按钮的存在和可点击性
      const deleteButton = page.locator(
        `[data-testid="delete-activity-${activity.id}"]`,
      );
      await expect(deleteButton).toBeVisible();
      await expect(deleteButton).toBeEnabled();

      // 点击删除按钮并确认
      await deleteButton.click();

      // 验证确认对话框
      await expect(page.locator(".swal2-popup")).toBeVisible();
      await expect(page.locator(".swal2-title")).toHaveText("确认删除");

      // 确认删除
      await page.click(".swal2-confirm");

      // 等待导航并验证活动已删除
      await expect(page.locator("main")).not.toContainText(activity.title);
    });

    test("取消删除活动", async ({
      testPage: page,
      createTestActivity,
      deleteTestActivity,
    }) => {
      // 使用 fixture 创建测试活动
      const activity = await createTestActivity();

      await page.goto("/admin");

      // 验证删除按钮的存在和可点击性
      const deleteButton = page.locator(
        `[data-testid="delete-activity-${activity.id}"]`,
      );
      await expect(deleteButton).toBeVisible();
      await expect(deleteButton).toBeEnabled();

      // 点击删除按钮
      await deleteButton.click();

      // 验证确认对话框
      const dialog = page.locator(".swal2-popup");
      await expect(dialog).toBeVisible();
      await expect(page.locator(".swal2-title")).toHaveText("确认删除");

      // 点击取消按钮
      await page.click(".swal2-cancel");

      // 验证对话框已关闭
      await expect(dialog).not.toBeVisible();

      // 验证活动仍然存在
      await page.goto("/admin");
      await expect(page.locator("main")).toContainText(activity.title);

      // 清理测试数据
      await deleteTestActivity(activity.id);
    });
  });
});
