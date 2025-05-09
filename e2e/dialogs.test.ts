import { test, expect } from "./fixtures";

test.describe("对话框测试", () => {
  let newActivityTitle: string;
  const baseActivityContent = "这是一个通过 e2e 测试自动创建的基础活动";

  // 报名表单对话框测试
  test.describe("报名表单对话框", () => {
    test("提交成功后应显示成功提示", async ({ testPage }) => {
      expect(
        newActivityTitle,
        "基准活动标题 newActivityTitle 未设置",
      ).toBeDefined();
      await testPage.goto(`/activity/${newActivityTitle}/register`);

      // 填写表单
      await testPage.fill('[id="name"]', "测试用户");
      await testPage.fill('[id="phone"]', "13800138000");

      // 提交表单
      await testPage.click('button[type="submit"]');

      // 验证成功对话框
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText("报名成功");
      await expect(testPage.locator(".swal2-html-container")).toHaveText(
        "您已成功报名参加活动",
      );

      // 确认对话框
      await testPage.click(".swal2-confirm");
      await expect(testPage.locator(".swal2-popup")).not.toBeVisible();
    });
  });

  // 活动表单对话框测试
  test.describe("活动表单对话框", () => {
    test.beforeEach(async ({ testPage }) => {
      await testPage.goto("/admin/new");
    });

    test("应创建基准活动并用于后续测试", async ({ testPage }) => {
      newActivityTitle = `e2e-activity-${Date.now()}`;

      // 填写表单
      await testPage.fill('[id="title"]', newActivityTitle);
      await testPage.fill('[id="content"]', baseActivityContent);

      // 设置未来24小时作为截止时间
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      await testPage.fill(
        '[id="deadline"]',
        deadline.toISOString().slice(0, 16),
      );

      // 设置中签人数
      await testPage.fill('[id="winnersCount"]', "30"); // 使用一个合理的中签人数

      // 提交表单
      await testPage.click('button[type="submit"]');

      // 验证成功对话框
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText("活动创建成功");
      await expect(testPage.locator(".swal2-html-container")).toContainText(
        newActivityTitle,
      );

      // 确认对话框
      await testPage.click(".swal2-confirm");

      // 验证重定向到管理页面
      await expect(testPage).toHaveURL(/.*\/admin$/);
    });

    test("中签人数过多时应显示警告确认", async ({ testPage }) => {
      // await testPage.goto("/admin/new"); // beforeEach 已经处理

      // 填写表单
      await testPage.fill('[id="title"]', "测试活动");
      await testPage.fill('[id="content"]', "这是一个测试活动的详细描述内容");

      // 设置未来24小时作为截止时间
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      await testPage.fill(
        '[id="deadline"]',
        deadline.toISOString().slice(0, 16),
      );

      // 设置过多的中签人数
      await testPage.fill('[id="winnersCount"]', "600");

      // 提交表单
      await testPage.click('button[type="submit"]');

      // 验证警告对话框
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText("中签人数确认");
      await expect(testPage.locator(".swal2-html-container")).toContainText(
        "600 人",
      );

      // 确认继续
      await testPage.click(".swal2-confirm");

      // 验证成功对话框
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText("活动创建成功");
    });

    test("创建活动成功后应显示成功提示", async ({ testPage }) => {
      // await testPage.goto("/admin/new"); // beforeEach 已经处理

      // 填写表单
      await testPage.fill('[id="title"]', "测试活动2");
      await testPage.fill('[id="content"]', "这是另一个测试活动的详细描述内容");

      // 设置未来24小时作为截止时间
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      await testPage.fill(
        '[id="deadline"]',
        deadline.toISOString().slice(0, 16),
      );

      // 设置正常的中签人数
      await testPage.fill('[id="winnersCount"]', "10");

      // 提交表单
      await testPage.click('button[type="submit"]');

      // 验证成功对话框
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText("活动创建成功");
      await expect(testPage.locator(".swal2-html-container")).toContainText(
        "测试活动2",
      );
    });
  });

  // 抽签结果对话框测试
  test.describe("抽签结果对话框", () => {
    test("查看结果时应显示结果公布提示", async ({ testPage }) => {
      expect(
        newActivityTitle,
        "基准活动标题 newActivityTitle 未设置",
      ).toBeDefined();
      await testPage.goto(`/activity/${newActivityTitle}/result`);

      // 验证结果公布对话框
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText(
        "抽签结果已公布",
      );
      await expect(testPage.locator(".swal2-html-container")).toContainText(
        "人报名",
      );
      await expect(testPage.locator(".swal2-html-container")).toContainText(
        "人中签",
      );

      // 确认对话框
      await testPage.click(".swal2-confirm");
      await expect(testPage.locator(".swal2-popup")).not.toBeVisible();
    });
  });

  // 活动 CRUD 测试
  test.describe("活动 CRUD 操作", () => {
    test.beforeEach(async ({ testPage }) => {
      expect(
        newActivityTitle,
        "基准活动标题 newActivityTitle 未设置",
      ).toBeDefined();
      await testPage.goto("/admin");
    });

    test("应能查看活动详情", async ({ testPage }) => {
      // 点击查看新创建的活动
      await testPage.click(`a:has-text("${newActivityTitle}")`);

      // 验证页面标题
      await expect(testPage.locator("h1")).toContainText(newActivityTitle);

      // 验证活动内容
      await expect(testPage.locator("article")).toContainText(
        baseActivityContent,
      );
    });

    test("应能更新活动信息", async ({ testPage }) => {
      // 进入编辑页面
      await testPage.click(`a:has-text("${newActivityTitle}")`);
      await testPage.click('a:has-text("编辑")');

      const updatedActivityTitle = `updated-${newActivityTitle}`;
      const updatedContent = "这是更新后的测试活动描述";

      // 更新活动信息
      await testPage.fill('[id="title"]', updatedActivityTitle);
      await testPage.fill('[id="content"]', updatedContent);

      // 提交更新
      await testPage.click('button[type="submit"]');

      // 验证成功提示
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toHaveText("活动创建成功"); // 假设更新和创建用同一个成功提示标题
      await expect(testPage.locator(".swal2-html-container")).toContainText(
        updatedActivityTitle,
      );

      // 确认更新
      await testPage.click(".swal2-confirm");

      // 更新全局变量以便后续测试（如删除）使用新标题
      newActivityTitle = updatedActivityTitle;

      // 验证更新结果
      await testPage.goto("/admin");
      await expect(testPage.locator("main")).toContainText(
        updatedActivityTitle,
      );
    });

    test("应能成功删除活动", async ({ testPage }) => {
      // 进入活动详情页 (使用可能已更新的 newActivityTitle)
      await testPage.click(`a:has-text("${newActivityTitle}")`);

      // 点击删除按钮
      await testPage.click('button:has-text("删除")');

      // 验证确认对话框
      await expect(testPage.locator(".swal2-popup")).toBeVisible();
      await expect(testPage.locator(".swal2-title")).toContainText("确认删除");

      // 确认删除
      await testPage.click(".swal2-confirm");

      // 验证删除成功
      await testPage.goto("/admin");
      await expect(testPage.locator("main")).not.toContainText(
        newActivityTitle, // 使用最新的 newActivityTitle
      );
    });
  });
});
