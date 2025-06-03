import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { fakerZH_CN as faker } from "@faker-js/faker";
import { generateRandomPhoneNumber } from "./utils";

interface RegistrationFormData {
  name: string;
  phone: string;
}

// 生成随机中文姓名
function generateChineseName(): string {
  return faker.person.fullName();
}

// 生成随机活动标题
function generateActivityTitle(): string {
  return faker.lorem.sentence();
}

// 生成随机活动内容
function generateActivityContent(): string {
  return faker.lorem.paragraphs(2);
}
// 辅助函数：填写报名表单
async function fillRegistrationForm(page: Page, data: RegistrationFormData) {
  await page.fill('[data-testid="registration-name"]', data.name);
  await page.fill('[data-testid="registration-phone"]', data.phone);
}

test.describe("报名功能测试", () => {
  let testActivity: {
    id: string;
    title: string;
  };

  test.beforeEach(async ({ createTestActivity }) => {
    // 创建测试活动
    testActivity = await createTestActivity({
      title: `${faker.company.name()}${faker.helpers.arrayElement(["专场活动", "报名抽签", "公益活动"])}`,
      content: faker.lorem.paragraphs(2).replace(/\n/g, "\n\n"),
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      winnersCount: 10,
      isPublished: true,
    });
  });

  test.describe("报名表单测试", () => {
    test.beforeEach(async ({ authedPage: page }) => {
      await page.goto(`/activity/${testActivity.id}/register`);
      // 等待表单加载完成
      await expect(
        page.locator('[data-testid="registration-form"]'),
      ).toBeVisible();
    });

    test("成功提交报名表单", async ({ authedPage: page }) => {
      const submitterName = generateChineseName();
      await fillRegistrationForm(page, {
        name: submitterName,
        phone: generateRandomPhoneNumber(),
      });

      await page.click('[data-testid="submit-registration"]');

      // 验证成功提示

      // 验证跳转到结果页面

      await expect(page).toHaveURL(`/activity/${testActivity.id}/result`);
      await expect(page.locator("main")).toContainText(submitterName);
    });

    test("表单验证 - 必填字段", async ({ authedPage: page }) => {
      // 直接提交空表单
      await page.click('[data-testid="submit-registration"]');

      // 验证错误提示
      await expect(page.locator('[data-testid="name-error"]')).toContainText(
        "姓名长度",
      );
      await expect(page.locator('[data-testid="phone-error"]')).toContainText(
        "手机号码必须是11位",
      );
    });

    test("表单验证 - 手机号格式", async ({ authedPage: page }) => {
      await fillRegistrationForm(page, {
        name: generateChineseName(),
        phone: "12345", // 无效的手机号
      });

      await page.click('[data-testid="submit-registration"]');

      // 验证错误提示
      await expect(page.locator('[data-testid="phone-error"]')).toContainText(
        "手机号码必须是11位",
      );
    });
  });

  test.describe("重复报名测试", () => {
    test("不允许重复报名", async ({ authedPage: page, pb }) => {
      // 先创建一个报名记录
      const testPhone = `138${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, "0")}`;

      await page.goto(`/activity/${testActivity.id}/register`);
      await expect(
        page.locator('[data-testid="registration-form"]'),
      ).toBeVisible();

      await fillRegistrationForm(page, {
        name: generateChineseName(),
        phone: testPhone,
      });

      await page.click('[data-testid="submit-registration"]');

      await expect(page).toHaveURL(`/activity/${testActivity.id}/result`);
      //再创建一次
      await page.goto(`/activity/${testActivity.id}/register`);
      await fillRegistrationForm(page, {
        name: generateChineseName(),
        phone: testPhone,
      });

      await page.click('[data-testid="submit-registration"]');

      // 验证错误提示
      await expect(
        page.locator('[data-testid="registration-error"]'),
      ).toContainText("请勿重复报名");
    });
  });

  test.describe("截止时间测试", () => {
    test("不允许在截止时间后报名", async ({ authedPage: page, pb }) => {
      // 更新活动为已截止
      await pb.collection("activities").update(testActivity.id, {
        deadline: new Date(Date.now() - 1000).toISOString(), // 设置为过去时间
      });

      await page.goto(`/activity/${testActivity.id}/register`);
      await expect(page.locator('text="已截止"')).toBeVisible();
    });
  });
});
