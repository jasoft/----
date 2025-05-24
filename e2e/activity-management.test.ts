import { test, expect, type TestFixtures } from "./fixtures";
import type { Page, Route, Request } from "@playwright/test";
import { fakerZH_CN as faker } from "@faker-js/faker";

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
  isPublished?: boolean;
}

// 辅助函数：填写活动表单
async function fillActivityForm(page: Page, data: ActivityFormData) {
  await page.waitForTimeout(1000);
  await page.fill('[data-testid="activity-title"]', data.title);
  await page.fill('[data-testid="activity-content"]', data.content);

  if (data.isPublished !== undefined) {
    const checkbox = page.locator('[data-testid="activity-is-published"]');
    const isChecked = await checkbox.isChecked();
    if ((isChecked && !data.isPublished) || (!isChecked && data.isPublished)) {
      await checkbox.click();
    }
  }

  const now = new Date();
  const defaultDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const deadline = data.deadline ?? defaultDeadline;
  const timezoneOffset = now.getTimezoneOffset() * 60000;
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
    test.beforeEach(async ({ authedPage: page }: TestFixtures) => {
      await page.goto("/admin/new");
      await expect(page.locator('[data-testid="activity-form"]')).toBeVisible();
    });

    test("成功创建活动", async ({
      authedPage: page,
      deleteTestActivity,
    }: TestFixtures) => {
      const activityData = generateActivityData();
      await fillActivityForm(page, {
        title: activityData.title,
        content: activityData.content,
        winnersCount: activityData.winnersCount,
        maxRegistrants: activityData.maxRegistrants,
        isPublished: false,
      });

      await page.click('button[type="submit"]');
      await page
        .getByRole("textbox", { name: "搜索活动标题或内容" })
        .fill(activityData.title);

      const viewLink = await page
        .getByRole("link", { name: "查看报名" })
        .getAttribute("href");
      const activityId = viewLink?.split("/").at(-2);
      await expect(page.locator("main")).toContainText(activityData.title);
      await page.getByTestId(`toggle-publish-${activityId}`).click();
      await expect(page.getByTestId("operation-alert")).toContainText("已发布");
      await deleteTestActivity(activityId!);
    });

    test("创建活动表单验证", async ({ authedPage: page }: TestFixtures) => {
      await fillActivityForm(page, {
        title: "",
        content: "",
        winnersCount: "",
        maxRegistrants: "",
      });
      await page.click('button[type="submit"]');
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
    }: TestFixtures) => {
      const activity = await createTestActivity({
        title: generateActivityData().title,
      });
      console.log("Created activity:", activity);
      const newActivityTitle = generateActivityData().title;

      await page.goto(`/admin/${activity.id}/edit`);
      await expect(page.locator('[data-testid="activity-form"]')).toBeVisible();
      await fillActivityForm(page, {
        title: newActivityTitle,
        content: activity.content,
      });
      await page.click('button[type="submit"]');

      await expect(page.locator("main")).toContainText(newActivityTitle);
    });

    test("编辑活动表单验证", async ({
      authedPage: page,
      createTestActivity,
    }: TestFixtures) => {
      const activity = await createTestActivity({
        title: generateActivityData().title,
      });
      await page.goto(`/admin/${activity.id}/edit`);
      await expect(page.locator('[data-testid="activity-form"]')).toBeVisible();
      await fillActivityForm(page, {
        title: "",
        content: "",
        winnersCount: "",
        maxRegistrants: "",
      });
      await page.click('button[type="submit"]');
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
    test("成功删除活动", async ({
      authedPage: page,
      createTestActivity,
    }: TestFixtures) => {
      const activity = await createTestActivity({
        title: generateActivityData().title,
      });
      await page.goto("/admin");
      await page.getByTestId(`delete-activity-${activity.id}`).click();
      await page.click(".swal2-confirm");
      await expect(page.locator("main")).not.toContainText(activity.title);
      await createTestActivity({ title: "delete me please" }); // 创建一个新的活动让fixture 清理，避免抛出异常。
    });

    test("删除活动失败", async ({
      authedPage: page,
      createTestActivity,
    }: TestFixtures) => {
      await page.route(
        "**/api/collections/activities/**",
        async (route: Route) => {
          const request: Request = route.request();
          if (request.method() === "DELETE") {
            await route.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ error: "删除失败" }),
            });
            return;
          }
          await route.continue();
        },
      );

      const activity = await createTestActivity({
        title: generateActivityData().title,
      });
      await page.goto("/admin");
      await page.getByTestId(`delete-activity-${activity.id}`).click();
      await page.click(".swal2-confirm");
      await expect(page.getByTestId("operation-alert")).toBeVisible();
      await expect(page.getByTestId("operation-alert")).toContainText(
        /(失败|unexpected|error)/,
      );
    });
  });

  test.describe("切换活动状态", () => {
    test("成功切换活动状态", async ({
      authedPage: page,
      createTestActivity,
    }: TestFixtures) => {
      const activity = await createTestActivity({
        title: generateActivityData().title,
        isPublished: false,
      });
      await page.goto("/admin");
      await page.getByTestId(`toggle-publish-${activity.id}`).click();
      await expect(page.getByTestId("operation-alert")).toContainText("已发布");
    });

    test("切换活动状态失败", async ({
      authedPage: page,
      createTestActivity,
    }: TestFixtures) => {
      await page.route(
        "**/api/collections/activities/**",
        async (route: Route) => {
          const request: Request = route.request();
          if (request.method() === "PATCH" || request.method() === "PUT") {
            await route.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ error: "状态切换失败" }),
            });
            return;
          }
          await route.continue();
        },
      );

      const activity = await createTestActivity({
        title: generateActivityData().title,
        isPublished: false,
      });
      await page.goto("/admin");
      await page.getByTestId(`toggle-publish-${activity.id}`).click();
      await expect(page.getByTestId("operation-alert")).toBeVisible();
      await expect(page.getByTestId("operation-alert")).toContainText(
        /(失败|unexpected|error)/,
      );
    });
  });

  test.describe("抽签功能", () => {
    test("成功进行抽签", async ({
      authedPage: page,
      createTestActivity,
      createTestRegistrants,
    }: TestFixtures) => {
      const activity = await createTestActivity({
        title: generateActivityData().title,
        isPublished: true,
      });
      await createTestRegistrants(activity.id, 5);
      await page.goto("/admin");
      await page.getByTestId(`draw-activity-${activity.id}`).click();
      await page.click(".swal2-confirm");
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "抽签结果已公布" }),
      ).toContainText("抽签结果已公布");
    });

    test("抽签失败", async ({
      authedPage: page,
      createTestActivity,
      createTestRegistrants,
    }: TestFixtures) => {
      await page.route(
        "**/api/collections/activities/**",
        async (route: Route) => {
          const request: Request = route.request();
          if (request.method() === "PATCH") {
            await route.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ error: "抽签失败" }),
            });
            return;
          }
          await route.continue();
        },
      );

      const activity = await createTestActivity({
        title: generateActivityData().title,
        isPublished: true,
      });
      await createTestRegistrants(activity.id, 5);
      await page.goto("/admin");
      await page.getByTestId(`draw-activity-${activity.id}`).click();
      await page.click(".swal2-confirm");
      await expect(page.getByTestId("operation-alert")).toBeVisible();
      await expect(page.getByTestId("operation-alert")).toContainText(
        /(失败|unexpected|error)/,
      );
    });
  });
});
