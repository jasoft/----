import { test, expect } from "./fixtures";
import { clerk } from "@clerk/testing/playwright";

test.skip("管理员认证", () => {
  test("登录和登出功能测试", async ({ authedPage }) => {
    // 使用已登录的页面实例
    const page = authedPage;

    // 访问管理员页面
    await page.goto("/admin");

    // 检查是否在管理页面
    await expect(page.getByRole("heading", { name: "活动管理" })).toBeVisible();

    await clerk.signOut({ page });
    // 点击用户菜单按钮
    // 等待页面导航完成
    await page.waitForURL("/user");

    // 尝试访问管理页面，应该被重定向到登录页
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
