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
  await page.click('[data-testid="submit-registration"]');

  // 等待成功提示
  await expect(page.locator(".swal2-title")).toHaveText("报名成功");
  await page.click(".swal2-confirm");
}

// 辅助函数：创建报名者数据
function createRegistrants(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    name: `测试用户${i + 1}`,
    phone: `1380013800${i + 1}`,
  }));
}

test.describe("抽签功能测试", () => {
  let testActivity: {
    id: string;
    title: string;
  };

  test.beforeEach(async ({ createTestActivity }) => {
    // 创建测试活动
    testActivity = await createTestActivity({
      title: `抽签测试活动-${Date.now()}`,
      content: "这是一个用于测试抽签功能的活动",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 设置为24小时后
      winnersCount: 2,
      maxRegistrants: 5,
      isPublished: true,
    });
  });

  test.afterEach(async ({ testPage, deleteTestActivity }) => {
    // if (testActivity?.id) {
    //   await deleteTestActivity(testActivity.id);
    // }
    await testPage.goto("/admin/logout");
  });

  test.describe("抽签流程", () => {
    test("完整的抽签流程", async ({ testPage: page, pb }) => {
      // 第一步：添加5个报名者
      const registrants = createRegistrants(5);
      for (const registrant of registrants) {
        await page.goto(`/activity/${testActivity.id}/register`);
        await expect(
          page.locator('[data-testid="registration-form"]'),
        ).toBeVisible();
        await fillRegistrationForm(page, registrant);
      }

      // 第二步：将活动设置为过期
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 设置为昨天
      await pb.collection("activities").update(testActivity.id, {
        deadline: pastDate.toISOString(),
      });

      // 第三步：随机选取两名中签者

      const registrationsList = await pb
        .collection("registrations")
        .getList(1, 50, {
          filter: `activity="${testActivity.id}"`,
        });
      const selectedWinners = registrationsList.items.slice(0, 2);

      // 更新中签状态
      await Promise.all(
        selectedWinners.map((winner) =>
          pb.collection("registrations").update(winner.id, {
            isWinner: true,
          }),
        ),
      );

      // 第四步：查看结果页面
      await page.goto(`/activity/${testActivity.id}/result`);

      // 验证显示了所有报名者
      await expect(page.locator(".card")).toHaveCount(registrants.length);
      for (const registrant of registrants) {
        await expect(page.locator("main")).toContainText(registrant.name);
      }

      // 验证中签人数
      const winnerRows = page.locator('[data-testid="winner-row"]');
      await expect(winnerRows).toHaveCount(2);

      // 验证抽签结果提示
      await expect(page.getByText("抽签结果已公布")).toBeVisible();
      await expect(
        page.getByText("本次活动共有 5 人报名，2 人中签"),
      ).toBeVisible();
    });
  });

  test.describe("结果页面显示", () => {
    test("未开奖活动显示等待提示", async ({ testPage: page }) => {
      await page.goto(`/activity/${testActivity.id}/result`);
      const now = new Date();
      const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await expect(
        page.getByText(`抽签结果将在 ${deadline.toLocaleString()} 后公布`),
      ).toBeVisible();
    });

    test("无报名活动显示提示信息", async ({ testPage: page, pb }) => {
      // 将活动设置为过期
      await pb.collection("activities").update(testActivity.id, {
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });

      await page.goto(`/activity/${testActivity.id}/result`);
      await expect(page.getByText("活动暂无报名，无法进行抽签")).toBeVisible();
    });
  });
});
