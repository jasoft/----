import { test, expect, type Request, type Response } from "@playwright/test";

interface AdminAuthResponse {
  token: string;
  model: {
    id: string;
    email: string;
  };
}

test.describe("管理后台移动端访问测试", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE 尺寸

  test("移动端访问认证流程", async ({ page }) => {
    // 存储请求响应信息
    const requests: Array<{ req: Request; res: Response | null }> = [];

    // 监听网络请求
    page.on("request", (request) => {
      console.log(`>> ${request.method()} ${request.url()}`);
      requests.push({ req: request, res: null });
    });

    page.on("response", async (response) => {
      const request = response.request();
      console.log(`<< ${response.status()} ${response.url()}`);

      const requestIndex = requests.findIndex((r) => r.req === request);
      if (requestIndex !== -1) {
        // 使用可选链和类型守卫确保安全访问
        const item = requests[requestIndex];
        if (item) {
          item.res = response;
        }
      }

      if (!response.ok()) {
        try {
          const text = await response.text();
          console.log("错误响应内容:", text);
        } catch (e) {
          console.log("无法获取响应内容");
        }
      }
    });

    // 访问管理后台
    const response = await page.goto("/admin");
    expect(response?.ok()).toBeTruthy();

    // 等待页面加载完成
    await page.waitForLoadState("networkidle");

    // 查找认证请求
    const authRequest = requests.find((r) =>
      r.req.url().includes("/api/admin/auth"),
    );

    // 验证认证请求
    expect(authRequest).toBeTruthy();

    if (authRequest?.res) {
      // 验证响应状态
      expect(authRequest.res.status()).toBe(200);

      try {
        // 获取并验证响应内容
        const responseBody =
          (await authRequest.res.json()) as AdminAuthResponse;
        console.log("认证响应:", responseBody);

        // 验证响应格式
        expect(responseBody).toHaveProperty("token");
        expect(responseBody).toHaveProperty("model");
        expect(typeof responseBody.token).toBe("string");
        expect(responseBody.model).toHaveProperty("id");
        expect(responseBody.model).toHaveProperty("email");
      } catch (e) {
        console.error("解析认证响应失败:", e);
      }
    }

    // 检查LocalStorage
    const authData = await page.evaluate(() =>
      localStorage.getItem("pocketbase_auth"),
    );
    console.log("LocalStorage认证数据:", authData);

    // 检查Cookie
    const cookies = await page.context().cookies();
    console.log("Cookies:", cookies);

    // 检查页面内容
    const errorElement = page.locator("text=加载失败");
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log("页面显示错误:", errorText);
    }
  });
});
