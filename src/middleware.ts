import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 获取请求的路径
  const pathname = request.nextUrl.pathname;

  // 如果是根路径，重定向到 /user
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/user", request.url));
  }

  // 其他路径不做处理
  return NextResponse.next();
}

// 配置需要执行 middleware 的路径
export const config = {
  matcher: ["/"],
};
