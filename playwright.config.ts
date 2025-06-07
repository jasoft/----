import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// 加载测试环境变量
dotenv.config({ path: ".env.test" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 10,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // 增加等待时间
    actionTimeout: 10000,
    navigationTimeout: 10000,
  },
  projects: [
    { name: "setup clerk", testMatch: /global\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 使用保存的登录状态
        storageState: "e2e/.auth/state.json",
      },
      dependencies: ["setup clerk"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI,
  },
});
