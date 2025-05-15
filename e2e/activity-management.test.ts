import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { fakerZH_CN as faker } from "@faker-js/faker";
import { createTimestampTitle } from "./utils";

// 生成随机活动数据
function generateActivityData() {
  const winnersCount = faker.number.int({ min: 5, max: 50 });
  return {
    title: `${faker.company.name()}${faker.helpers.arrayElement(["专场活动", "报名抽签", "公益活动"])}`,
    content: faker.lorem.paragraphs(2).replace(/\n/g, "\n\n"),
    winnersCount: winnersCount.toString(),
    maxRegistrants: (
      winnersCount * faker.number.int({ min: 2, max: 5 })
    ).toString(),
  };
}

interface ActivityFormData {
  title: string;
  content: string;
  deadline?: Date;
  winnersCount?: string;
  maxRegistrants?: string;
}

// 辅助函数：填写活动表单
async function fillActivityForm(page: Page, data: ActivityFormData) {
  console.log("填写活动表单", data);
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
    test.beforeEach(async ({ authedPage: page }) => {
      await page.goto("/admin/new");
      await expect(page.locator('[data-testid="activity-form"]')).toBeVisible();
    });
    test("成功创建活动", async ({ authedPage: page, deleteTestActivity }) => {
      const activityData = generateActivityData();
      await fillActivityForm(page, {
        title: activityData.title,
        content: activityData.content,
        winnersCount: activityData.winnersCount,
        maxRegistrants: activityData.maxRegistrants,
      });

      await page.click('button[type="submit"]');
      await page
        .getByRole("textbox", { name: "搜索活动标题或内容" })
        .fill(activityData.title);

      const viewLink = await page
        .getByRole("link", { name: "查看结果" })
        .getAttribute("href");
      const activityId = viewLink?.split("/").at(-2);
      // 验证活动显示在列表中
      // 等待页面加载完成
      // 验证活动已成功创建并显示在页面中
      await expect(page.locator("main")).toContainText(activityData.title);

      await page.getByTestId(`toggle-publish-${activityId}`).click();
      await expect(page.getByTestId("operation-alert")).toContainText("已发布");
      await deleteTestActivity(activityId!);

      // 清理测试数据
    });

    test("创建活动表单验证", async ({ authedPage: page }) => {
      // 只填写标题，其他字段留空以触发验证
      await fillActivityForm(page, {
        title: "",
        content: "", // Intentionally left blank
        winnersCount: "", // Intentionally left blank
        maxRegistrants: "", // Intentionally left blank
      });
      await page.click('button[type="submit"]');

      // 验证表单验证错误信息
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
  });

  test.describe("编辑活动", () => {
    test("成功编辑活动", async ({
      authedPage: page,
      createTestActivity,
      deleteTestActivity,
    }) => {
      const activity = await createTestActivity({
        title: generateActivityData().title,
      });
      const newActivityTitle = generateActivityData().title;

      await page.goto(`/admin/${activity.id}/edit`);
      await expect(page.locator('[data-testid="activity-form"]')).toBeVisible(); //等待form显示出来
      // 只更新标题
      await fillActivityForm(page, {
        title: newActivityTitle,
        // content, deadline, etc., will use existing values or defaults from form
        // if the form is designed to keep them, otherwise specify them if needed.
        // For this case, assuming only title is being edited.
        content: activity.content, // Assuming we want to keep original content
      });
      await page.click('button[type="submit"]');

      // 验证活动标题已更新
      await expect(page.locator("main")).toContainText(newActivityTitle);

      // 清理测试数据
      await deleteTestActivity(activity.id);
    });

    test("编辑活动表单验证", async ({
      authedPage: page,
      createTestActivity,
    }) => {
      const activity = await createTestActivity({
        title: generateActivityData().title,
      });
      await page.goto(`/admin/${activity.id}/edit`);

      await expect(page.locator('[data-testid="activity-form"]')).toBeVisible();
      // 尝试将标题和其他字段设置为空以触发验证
      await fillActivityForm(page, {
        title: "",
        content: "", // Intentionally left blank
        winnersCount: "", // Intentionally left blank
        maxRegistrants: "", // Intentionally left blank
      });
      await page.click('button[type="submit"]');

      // 验证表单验证错误信息
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
  });

  test.describe("删除活动", () => {
    test("成功删除活动", async ({ authedPage: page, createTestActivity }) => {
      const activity = await createTestActivity({
        title: generateActivityData().title,
      });
      await page.goto("/admin");

      // 点击删除按钮
      await page.getByTestId(`delete-activity-${activity.id}`).click();

      // 确认删除
      await page.click(".swal2-confirm");

      // 验证活动已删除
      await expect(page.locator("main")).not.toContainText(activity.title);
    });

    test("删除活动失败", async ({
      authedPage: page,
      createTestActivity,
      deleteTestActivity,
    }) => {
      const activity = await createTestActivity({
        title: generateActivityData().title,
      });
      await page.goto("/admin");

      // 设置路由拦截
      await page.route(
        "**/api/collections/activities/records/**",
        async (route) => {
          if (route.request().method() === "DELETE") {
            await route.fulfill({
              status: 500,
              body: JSON.stringify({ message: "删除失败" }),
            });
          } else {
            await route.continue();
          }
        },
      );

      // 点击删除按钮
      await page.getByTestId(`delete-activity-${activity.id}`).click();

      // 确认删除
      await page.click(".swal2-confirm");

      // 验证错误提示
      await expect(page.locator(".swal2-popup")).toBeVisible();
      await expect(page.getByTestId("operation-alert")).toContainText(
        "删除失败",
      );
    });
  });

  test.describe("切换活动状态", () => {
    test("成功切换活动状态", async ({
      authedPage: page,
      createTestActivity,
    }) => {
      const activity = await createTestActivity({
        title: generateActivityData().title,
        isPublished: false,
      });
      await page.goto("/admin");

      // 切换活动状态
      await page.click(`[data-testid="toggle-publish-${activity.id}"]`);

      // 验证活动状态已切换
      await expect(page.getByTestId("operation-alert")).toContainText("已发布");
    });
  });
});
