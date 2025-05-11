import { test, expect } from "./fixtures";

test.describe("操作反馈提示测试", () => {
  test("删除活动应显示成功提示", async ({ testPage, createTestActivity }) => {
    const activity = await createTestActivity();
    await testPage.goto("/admin");

    // 点击删除按钮
    await testPage.click(`[data-testid="delete-activity-${activity.id}"]`);

    // 等待并确认删除对话框
    await expect(testPage.locator(".swal2-popup")).toBeVisible();
    await expect(testPage.locator(".swal2-title")).toHaveText("确认删除");
    await testPage.click(".swal2-confirm");

    // 等待确认对话框消失和动画完成
    await testPage.waitForSelector(".swal2-popup", { state: "hidden" });
    await testPage.waitForTimeout(500);

    // 验证成功提示
    const toastMessage = testPage.locator('[data-testid="toast-message"]');
    await expect(toastMessage).toBeVisible({ timeout: 10000 });
    await expect(toastMessage).toContainText(/已删除/i);

    // 等待提示消失
    await expect(toastMessage).not.toBeVisible({
      timeout: 6000,
    });
  });

  test("批量删除活动应显示成功提示", async ({
    testPage,
    createTestActivity,
  }) => {
    // 创建两个测试活动
    const activity1 = await createTestActivity();
    const activity2 = await createTestActivity();

    await testPage.goto("/admin");

    // 选中两个活动
    await testPage.click(
      `[data-testid="activity-${activity1.id}"] input[type="checkbox"]`,
    );
    await testPage.click(
      `[data-testid="activity-${activity2.id}"] input[type="checkbox"]`,
    );

    // 点击批量删除
    await testPage.click("button:has-text('批量删除')");

    // 等待并确认删除对话框
    await expect(testPage.locator(".swal2-popup")).toBeVisible();
    await expect(testPage.locator(".swal2-title")).toHaveText("确认批量删除");
    await testPage.click(".swal2-confirm");

    // 等待确认对话框消失和动画完成
    await testPage.waitForSelector(".swal2-popup", { state: "hidden" });
    await testPage.waitForTimeout(500);

    // 验证成功提示
    const toastMessage = testPage.locator('[data-testid="toast-message"]');
    await expect(toastMessage).toBeVisible({ timeout: 10000 });
    await expect(toastMessage).toContainText(/选中的活动已成功删除/i);

    // 等待提示消失
    await expect(toastMessage).not.toBeVisible({
      timeout: 6000,
    });
  });

  test("切换活动状态应显示成功提示", async ({
    testPage,
    createTestActivity,
  }) => {
    const activity = await createTestActivity();
    await testPage.goto("/admin");

    // 点击结束按钮
    await testPage.click(
      `[data-testid="activity-${activity.id}"] button:has-text("结束")`,
    );

    // 验证成功提示
    const toastMessage = testPage.locator('[data-testid="toast-message"]');
    await expect(toastMessage).toBeVisible({ timeout: 10000 });
    await expect(toastMessage).toContainText(/活动已结束/i);

    // 等待提示消失
    await expect(toastMessage).not.toBeVisible({
      timeout: 6000,
    });

    // 点击开启按钮
    await testPage.click(
      `[data-testid="activity-${activity.id}"] button:has-text("开启")`,
    );

    // 验证成功提示
    await expect(toastMessage).toBeVisible({ timeout: 10000 });
    await expect(toastMessage).toContainText(/活动已开启/i);

    // 等待提示消失
    await expect(toastMessage).not.toBeVisible({
      timeout: 6000,
    });
  });

  test("删除失败应显示错误提示", async ({ testPage, createTestActivity }) => {
    const activity = await createTestActivity();
    await testPage.goto("/admin");

    let deleteAttempted = false;
    const errorMessage = `删除活动"${activity.title}"失败`;

    // 设置路由拦截
    await testPage.route(
      "**/api/collections/activities/records/**",
      async (route) => {
        if (route.request().method() === "DELETE") {
          deleteAttempted = true;
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              message: errorMessage,
              data: { code: "OPERATION_FAILED" },
            }),
          });
        } else {
          await route.continue();
        }
      },
    );

    const toast = testPage.locator('[data-testid="toast-message"]');
    const confirmDialog = testPage.locator(".swal2-popup");
    const activityItem = testPage.locator(
      `[data-testid="activity-${activity.id}"]`,
    );

    // 点击删除按钮并确认
    await activityItem.locator('[data-testid^="delete-activity"]').click();
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.locator(".swal2-html-container")).toContainText(
      activity.title,
    );

    // 确认删除
    await testPage.click(".swal2-confirm");

    // 验证删除请求被尝试
    expect(deleteAttempted).toBe(true);

    // 等待确认对话框消失和所有动画完成
    await confirmDialog.waitFor({ state: "hidden" });
    await testPage.waitForTimeout(1000);

    // 验证错误提示
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toContainText(errorMessage);

    // 等待提示消失
    await expect(toast).not.toBeVisible({
      timeout: 6000,
    });

    // 验证活动仍然存在
    await expect(activityItem).toBeVisible();
  });
});
