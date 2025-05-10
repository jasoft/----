import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

// 记录登录尝试次数
const loginAttempts = new Map<string, { count: number; timestamp: number }>();

// 清理过期的登录尝试记录 (1小时后过期)
const cleanupLoginAttempts = () => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.timestamp > 60 * 60 * 1000) {
      loginAttempts.delete(ip);
    }
  }
};

// 检查是否超出尝试次数限制
const checkLoginAttempts = (ip: string): boolean => {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    loginAttempts.set(ip, { count: 1, timestamp: now });
    return true;
  }

  // 如果距离上次尝试超过1小时，重置计数
  if (now - attempt.timestamp > 60 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, timestamp: now });
    return true;
  }

  // 超过5次尝试，限制访问
  if (attempt.count >= 5) {
    return false;
  }

  attempt.count += 1;
  attempt.timestamp = now;
  return true;
};

export async function POST(request: Request) {
  try {
    // 获取客户端IP
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    // 清理过期记录
    cleanupLoginAttempts();

    // 检查登录限制
    if (!checkLoginAttempts(ip)) {
      return NextResponse.json(
        { error: "登录尝试次数过多，请1小时后重试" },
        { status: 429 },
      );
    }

    // 验证环境变量
    if (
      !process.env.POCKETBASE_ADMIN_EMAIL ||
      !process.env.POCKETBASE_ADMIN_PASSWORD
    ) {
      console.error("管理员凭据未配置");
      return NextResponse.json(
        { error: "系统配置错误：管理员凭据未设置" },
        { status: 500 },
      );
    }

    // 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    try {
      await pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD,
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      return NextResponse.json({
        token: pb.authStore.token,
        model: pb.authStore.model,
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return NextResponse.json(
            { error: "认证请求超时，请稍后重试" },
            { status: 504 },
          );
        }

        // PocketBase具体错误
        const message = error.message.toLowerCase();
        if (message.includes("invalid")) {
          return NextResponse.json(
            { error: "管理员账号或密码错误" },
            { status: 401 },
          );
        }
        if (
          message.includes("network") ||
          message.includes("failed to fetch")
        ) {
          return NextResponse.json(
            { error: "无法连接到服务器，请检查网络连接" },
            { status: 503 },
          );
        }
      }

      console.error("管理员认证错误:", error);
      return NextResponse.json(
        { error: "认证过程发生未知错误" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("管理员认证请求处理失败:", error);
    return NextResponse.json({ error: "请求处理失败" }, { status: 500 });
  }
}
