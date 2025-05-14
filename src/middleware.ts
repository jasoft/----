import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "./env.mjs";

// 测试环境中间件
const testMiddleware = async (req: NextRequest) => {
  if (req.nextUrl.pathname === "/") {
    const userUrl = new URL("/user", req.url);
    return NextResponse.redirect(userUrl);
  }
  // 测试环境中，所有请求都当作管理员处理
  return NextResponse.next();
};

// 生产环境中间件
const productionMiddleware = clerkMiddleware(async (auth, req) => {
  const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);
  const { userId } = await auth();
  if (req.nextUrl.pathname === "/") {
    const userUrl = new URL("/user", req.url);
    return NextResponse.redirect(userUrl);
  }

  if (userId !== "user_2x4JFHTkMIcPAmaLrHcgJvkvXpP") {
    // 管理员
    // Add custom logic to run before redirecting
    if (isProtectedRoute(req)) await auth.protect();
  }
});

console.log("NEXT_PUBLIC_SKIP_AUTH_IN_TEST", env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST);
// 根据环境变量选择中间件
const middleware =
  env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST === "true"
    ? testMiddleware
    : productionMiddleware;
export default middleware;

export const config = {
  matcher: [
    // 跳过Next.js内部和所有静态文件
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // 始终运行API路由
    "/(api|trpc)(.*)",
  ],
};
