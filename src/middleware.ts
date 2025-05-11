import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPocketBaseClientInstance, type AuthModel } from "./lib/pb";
import { AdminAuth } from "./lib/auth";
import type { AuthRecord } from "pocketbase";

const COOKIE_NAME = "pb_auth";

interface AuthCookieData {
  token: string;
  model: AuthRecord;
}

export async function middleware(request: NextRequest) {
  // 将根路径重定向到/user
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/user", request.url));
  }

  // 如果路径不以/admin开头，则不拦截
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // 如果是登录页面则允许访问
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  console.log("[Middleware] 开始验证请求:", {
    path: request.nextUrl.pathname,
    authCookie: request.cookies.get(COOKIE_NAME)?.value,
  });

  const pb = getPocketBaseClientInstance();

  try {
    // 从cookie中恢复认证状态
    const authCookie = request.cookies.get(COOKIE_NAME);
    if (!authCookie?.value) {
      console.log("[Middleware] 未找到认证Cookie");
      throw new Error("未登录");
    }

    // 解析认证数据
    let authData: AuthCookieData;
    try {
      authData = JSON.parse(authCookie.value) as AuthCookieData;
      // 验证数据格式
      if (!authData.token || !authData.model?.id || !authData.model?.email) {
        throw new Error("认证数据格式错误");
      }
    } catch (e) {
      console.log("[Middleware] 认证数据解析失败:", e);
      throw new Error("认证数据无效");
    }

    // 保存认证状态
    pb.authStore.save(authData.token, authData.model);

    // 检查认证状态
    if (!pb.authStore.isValid) {
      console.log("[Middleware] 认证状态无效");
      throw new Error("未登录");
    }

    const model = pb.authStore.record as AuthModel;

    if (model.role !== "admin") {
      console.log("[Middleware] 认证用户不是管理员");
      throw new Error("没有权限访问该页面");
    }

    console.log("[Middleware] 认证状态有效:", {
      token: pb.authStore.token ? "存在" : "不存在",
      model: model
        ? {
            id: String(model.id),
            username: String(model.username),
            role: model.role ? String(model.role) : undefined,
          }
        : null,
    });

    // 检查token是否过期
    if (model?.tokenExpire) {
      const tokenExpire = new Date(model.tokenExpire);
      if (tokenExpire < new Date()) {
        console.log("[Middleware] Token已过期:", {
          tokenExpire: model.tokenExpire,
          now: new Date().toISOString(),
        });
        throw new Error("登录已过期");
      }
    }

    console.log("[Middleware] 验证通过");
    return NextResponse.next();
  } catch (error) {
    // 认证失败，重定向到登录页
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("from", request.nextUrl.pathname);
    const response = NextResponse.redirect(url);

    console.log("[Middleware] 验证失败:", {
      error: error instanceof Error ? error.message : String(error),
      redirect: url.toString(),
    });

    // 清除认证状态
    pb.authStore.clear();

    return response;
  }
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
