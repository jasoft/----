import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

interface RegistrationFormData {
  name: string;
  phone: string;
}

// 辅助函数：填写报名表单
async function fillRegistrationForm(page: Page, data: RegistrationFormData) {
  await page.fill('[data-testid="registration-name"]', data.name);
  await page.fill('[data-testid="registration-phone"]', data.phone);
}

// 辅助函数：执行退出登录
async function logout(page: Page) {
  // 点击退出登录按钮
  await page.click('button:has-text("退出登录")');
  // 等待页面刷新完成
  await page.waitForURL("/");
}

test.describe("报名功能测试", () => {
  let testActivity: {
    id: string;
    title: string;
  };

  test.beforeEach(async ({ createTestActivity }) => {
    // 创建测试活动
    testActivity = await createTestActivity({
      title: `报名测试活动-${Date.now()}`,
      content: "这是一个用于测试报名功能的活动",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      winnersCount: 10,
      isPublished: true,
    });
  });

  test.afterEach(async ({ deleteTestActivity }) => {
    if (testActivity?.id) {
      await deleteTestActivity(testActivity.id);
    }
  });

  test.describe("报名表单测试", () => {
    test.beforeEach(async ({ testPage }) => {
      await testPage.goto(`/activity/${testActivity.id}/register`);
      // 等待表单加载完成
      await expect(
        testPage.locator('[data-testid="registration-form"]'),
      ).toBeVisible();
    });

    test("成功提交报名表单", async ({ testPage }) => {
      await fillRegistrationForm(testPage, {
        name: "张三",
        phone: "13800138000",
      });

      await testPage.click('[data-testid="submit-registration"]');

      // 验证成功提示
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText("报名成功");
      await expect(testPage.locator(".swal2-html-container")).toContainText(
        "您已成功报名参加活动",
      );
      await testPage.click(".swal2-confirm"); // 关闭提示框
    });

    test("表单验证 - 必填字段", async ({ testPage }) => {
      // 直接提交空表单
      await testPage.click('[data-testid="submit-registration"]');

      // 验证错误提示
      await expect(testPage.locator('text="姓名不能为空"')).toBeVisible();
      await expect(testPage.locator('text="手机号码必须是11位"')).toBeVisible();
    });

    test("表单验证 - 手机号格式", async ({ testPage }) => {
      await fillRegistrationForm(testPage, {
        name: "张三",
        phone: "12345", // 无效的手机号
      });

      await testPage.click('[data-testid="submit-registration"]');

      // 验证错误提示
      await expect(testPage.locator('text="手机号码格式无效"')).toBeVisible();
      await expect(testPage.locator('text="11位数字"')).toBeVisible();
      await expect(testPage.locator('text="以1开头"')).toBeVisible();
    });
  });

  test.describe("重复报名测试", () => {
    test("不允许重复报名", async ({ testPage, pb }) => {
      // 先创建一个报名记录
      await pb.collection("registrations").create({
        activity: testActivity.id,
        name: "张三",
        phone: "13800138000",
      });

      await testPage.goto(`/activity/${testActivity.id}/register`);
      await expect(
        testPage.locator('[data-testid="registration-form"]'),
      ).toBeVisible();

      await fillRegistrationForm(testPage, {
        name: "张三",
        phone: "13800138000",
      });

      await testPage.click('[data-testid="submit-registration"]');

      // 验证错误提示
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText("报名失败");
      await expect(testPage.locator(".swal2-html-container")).toContainText(
        "您已经报名过该活动",
      );
    });
  });

  test.describe("截止时间测试", () => {
    test("不允许在截止时间后报名", async ({ testPage, pb }) => {
      // 更新活动为已截止
      await pb.collection("activities").update(testActivity.id, {
        deadline: new Date(Date.now() - 1000).toISOString(), // 设置为过去时间
      });

      await testPage.goto(`/activity/${testActivity.id}/register`);
      await expect(
        testPage.locator('[data-testid="registration-form"]'),
      ).toBeVisible();

      await fillRegistrationForm(testPage, {
        name: "张三",
        phone: "13800138000",
      });

      await testPage.click('[data-testid="submit-registration"]');

      // 验证错误提示
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText("报名失败");
      await expect(testPage.locator(".swal2-html-container")).toContainText(
        "活动报名已截止",
      );
    });
  });
});
