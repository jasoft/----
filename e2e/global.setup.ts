import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userInfoPath = path.join(__dirname, ".auth/user-info.json");
const authCachePath = path.join(__dirname, ".auth/auth-cache.json");
const statePath = path.join(__dirname, ".auth/state.json");

// Cache duration: 24 hours in milliseconds
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface AuthCache {
  timestamp: number;
  userId: string;
  userInfo: { userId: string };
  hasValidState: boolean;
}

/**
 * 检查缓存是否有效（存在且未过期）
 */
function isCacheValid(): boolean {
  try {
    if (!fs.existsSync(authCachePath)) {
      console.log("认证缓存文件不存在");
      return false;
    }

    if (!fs.existsSync(statePath)) {
      console.log("状态文件不存在");
      return false;
    }

    const cacheData = JSON.parse(
      fs.readFileSync(authCachePath, "utf-8"),
    ) as AuthCache;
    const now = Date.now();
    const isExpired = now - cacheData.timestamp > CACHE_DURATION;

    if (isExpired) {
      console.log(
        `认证缓存已过期，缓存时间: ${new Date(cacheData.timestamp).toLocaleString()}`,
      );
      return false;
    }

    console.log(
      `认证缓存有效，剩余时间: ${Math.round((CACHE_DURATION - (now - cacheData.timestamp)) / (60 * 60 * 1000))} 小时`,
    );
    return true;
  } catch (error) {
    console.log("检查缓存时出错:", error);
    return false;
  }
}

/**
 * 保存认证缓存
 */
function saveAuthCache(userId: string): void {
  try {
    const cacheData: AuthCache = {
      timestamp: Date.now(),
      userId,
      userInfo: { userId },
      hasValidState: true,
    };

    // 确保目录存在
    const authDir = path.dirname(authCachePath);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    fs.writeFileSync(authCachePath, JSON.stringify(cacheData, null, 2));
    console.log("认证缓存已保存");
  } catch (error) {
    console.error("保存认证缓存失败:", error);
  }
}

/**
 * 从缓存加载用户信息
 */
function loadCachedUserInfo(): { userId: string } | null {
  try {
    if (!fs.existsSync(authCachePath)) {
      return null;
    }

    const cacheData = JSON.parse(
      fs.readFileSync(authCachePath, "utf-8"),
    ) as AuthCache;
    return cacheData.userInfo;
  } catch (error) {
    console.error("加载缓存用户信息失败:", error);
    return null;
  }
}

/**
 * 清除认证缓存
 * 可以通过环境变量 CLEAR_AUTH_CACHE=true 来强制清除缓存
 */
function clearAuthCache(): void {
  try {
    if (fs.existsSync(authCachePath)) {
      fs.unlinkSync(authCachePath);
      console.log("认证缓存已清除");
    }
  } catch (error) {
    console.error("清除认证缓存失败:", error);
  }
}

// Setup must be run serially, this is necessary if Playwright is configured to run fully parallel: https://playwright.dev/docs/test-parallel
setup.describe.configure({ mode: "serial" });

setup("global setup", async ({ page, context }) => {
  try {
    console.log("开始 E2E 认证设置...");

    // 检查是否需要强制清除缓存
    if (process.env.CLEAR_AUTH_CACHE === "true") {
      console.log("检测到 CLEAR_AUTH_CACHE=true，清除现有缓存");
      clearAuthCache();
    }

    // 检查是否有有效的缓存
    if (isCacheValid()) {
      console.log("使用缓存的认证信息，跳过登录流程");

      // 从缓存加载用户信息
      const cachedUserInfo = loadCachedUserInfo();
      if (cachedUserInfo) {
        // 确保用户信息文件存在
        fs.writeFileSync(userInfoPath, JSON.stringify(cachedUserInfo));
        console.log("认证设置完成（使用缓存）");
        return;
      }
    }

    console.log("缓存无效或不存在，执行完整登录流程");

    // 设置 Clerk
    await clerkSetup();
    await setupClerkTestingToken({ context });

    // 执行登录
    await page.goto("/sign-in");
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        password: process.env.TEST_USER_PASSWORD ?? "",
        identifier: process.env.TEST_USER_NAME ?? "",
      },
    });

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

    // 保存用户信息
    fs.writeFileSync(userInfoPath, JSON.stringify({ userId }));

    // 保存登录状态到文件
    await context.storageState({
      path: statePath,
    });

    // 保存认证缓存
    saveAuthCache(userId);

    // 最终等待确保所有状态都已保存
    await page.waitForTimeout(1000);

    console.log("认证设置完成（新登录）");
  } catch (error) {
    console.error("Clerk setup failed:", error);
    throw error;
  }
});
