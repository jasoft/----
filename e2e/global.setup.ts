import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userInfoPath = path.join(__dirname, ".auth/user-info.json");

// Setup must be run serially, this is necessary if Playwright is configured to run fully parallel: https://playwright.dev/docs/test-parallel
setup.describe.configure({ mode: "serial" });

setup("global setup", async ({ page, context }) => {
  try {
    // 设置 Clerk
    await clerkSetup();
    await setupClerkTestingToken({ context });

    // 执行登录
    await page.goto("/sign-in");
    await page.waitForTimeout(2000);
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        password: process.env.TEST_USER_PASSWORD ?? "",
        identifier: process.env.TEST_USER_NAME ?? "",
      },
    });

    // 等待页面完全加载
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // 获取用户 ID
    await clerk.loaded({ page });

    // 等待 Clerk 完全初始化
    await page.waitForFunction(
      () => {
        const w = window as { Clerk?: { user?: { id: string } } };
        return w.Clerk?.user?.id;
      },
      { timeout: 10000 },
    );

    const userId = await page.evaluate(() => {
      const w = window as { Clerk?: { user?: { id: string } } };
      return w.Clerk?.user?.id;
    });

    if (!userId) {
      throw new Error("未能获取用户ID");
    }

    // 额外等待确保登录状态稳定
    await page.waitForTimeout(3000);

    // 保存用户信息
    fs.writeFileSync(userInfoPath, JSON.stringify({ userId }));

    // 保存登录状态到文件
    await context.storageState({
      path: path.join(__dirname, ".auth/state.json"),
    });

    // 最终等待确保所有状态都已保存
    await page.waitForTimeout(1000);
  } catch (error) {
    console.error("Clerk setup failed:", error);
    throw error;
  }
});
