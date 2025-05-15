import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

// Setup must be run serially, this is necessary if Playwright is configured to run fully parallel: https://playwright.dev/docs/test-parallel
setup.describe.configure({ mode: "serial" });

setup("global setup", async ({}) => {
  try {
    await clerkSetup();
  } catch (error) {
    console.error("Clerk setup failed:", error);
  }
  // Set timeout to 10 seconds
});
