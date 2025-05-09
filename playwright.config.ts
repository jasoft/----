import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// 加载测试环境变量
dotenv.config({ path: ".env.test" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "dot",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // 增加等待时间
    actionTimeout: 10000,
    navigationTimeout: 10000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000, // 增加启动超时时间
  },
});
