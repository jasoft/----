import { test, expect } from "./fixtures";

test.describe("管理员认证", () => {
  test("登录和登出功能测试", async ({ testPage }) => {
    // 登录后验证管理员界面
    await testPage.goto("/admin");
    await expect(
      testPage.getByRole("link", { name: "退出登录" }),
    ).toBeVisible();
    await expect(
      testPage.getByRole("heading", { name: "活动管理" }),
    ).toBeVisible();

    // 通过导航链接登出
    await testPage.click('a:has-text("退出登录")');
    await testPage.waitForLoadState("networkidle");
    await expect(
      testPage.getByRole("link", { name: "退出登录" }),
    ).not.toBeVisible();

    // 等待页面重定向到首页

    // 尝试访问管理页面，应该被重定向到登录页
    await testPage.goto("/admin");
    await expect(testPage).toHaveURL(/\/admin\/login/);

    // 验证登录表单出现
    await expect(testPage.locator("#username")).toBeVisible();
    await expect(testPage.locator("#password")).toBeVisible();
  });
});
