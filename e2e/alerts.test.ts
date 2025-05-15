import { test, expect, createTimestampTitle } from "./fixtures";

test.describe("操作反馈提示测试", () => {
  test("删除活动应显示成功提示", async ({
    authedPage,
    createTestActivity,
    deleteTestActivity,
  }) => {
    const activity = await createTestActivity({
      title: createTimestampTitle("删除提示测试"),
    });
    await authedPage.goto("/admin/activities");

    // 点击删除按钮
    await authedPage.click(`[data-testid="delete-activity-${activity.id}"]`);

    // 等待并确认删除对话框
    await expect(authedPage.locator(".swal2-popup")).toBeVisible();
    await expect(authedPage.locator(".swal2-title")).toHaveText("确认删除");
    await authedPage.click(".swal2-confirm");

    // 等待确认对话框消失和动画完成
    await authedPage.waitForSelector(".swal2-popup", { state: "hidden" });
    await authedPage.waitForTimeout(500);

    // 验证成功提示
    const toastMessage = authedPage.locator('[data-testid="toast-message"]');
    await expect(toastMessage).toBeVisible({ timeout: 10000 });
    await expect(toastMessage).toContainText(/已删除/i);

    // 等待提示消失
    await expect(toastMessage).not.toBeVisible({
      timeout: 6000,
    });
    await deleteTestActivity(activity.id);
  });

  test("删除失败应显示错误提示", async ({
    authedPage,
    createTestActivity,
    deleteTestActivity,
  }) => {
    const activity = await createTestActivity({
      title: createTimestampTitle("删除失败提示测试"),
    });
    await authedPage.goto("/admin");

    let deleteAttempted = false;
    const errorMessage = `删除活动"${activity.title}"失败`;

    // 设置路由拦截
    await authedPage.route(
      "**/api/collections/activities/records/**",
      async (route) => {
        console.log(
          `拦截请求: ${route.request().method()} ${route.request().url()}`,
        );
        if (route.request().method() === "DELETE") {
          deleteAttempted = true;
          console.log("删除活动请求被拦截, deleteAttempted:", deleteAttempted);
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

    const toast = authedPage.locator('[data-testid="toast-message"]');
    const confirmDialog = authedPage.locator(".swal2-popup");
    const activityItem = authedPage.locator(
      `[data-testid="activity-${activity.id}"]`,
    );

    // 点击删除按钮并确认
    await activityItem.locator('[data-testid^="delete-activity"]').click();
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.locator(".swal2-html-container")).toContainText(
      activity.title,
    );

    // 确认删除
    await authedPage.click(".swal2-confirm");

    // 等待删除请求完成

    // 验证删除请求被尝试

    // 等待确认对话框消失和所有动画完成
    await confirmDialog.waitFor({ state: "hidden" });
    await authedPage.waitForTimeout(1000);

    // 验证错误提示
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toContainText(errorMessage);

    // 等待提示消失
    await expect(toast).not.toBeVisible({
      timeout: 6000,
    });

    console.log(`等待删除请求完成, deleteAttempted: ${deleteAttempted}`);
    expect(deleteAttempted).toBe(true);

    // 验证活动仍然存在
    await expect(activityItem).toBeVisible();
    await deleteTestActivity(activity.id);
  });
});
