import { NextResponse } from "next/server";
import { adminLogout } from "~/lib/pb";

export async function GET() {
  // 调用pb的退出登录
  adminLogout();

  const redirectUrl = new URL("/", process.env.NEXT_PUBLIC_BASE_URL);
  const response = NextResponse.redirect(redirectUrl);

  // 清除cookie
  response.cookies.set({
    name: "pb_auth",
    value: "",
    expires: new Date(0),
    path: "/",
  });

  // 设置清除localStorage的脚本
  response.headers.set(
    "Set-Cookie",
    "pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT",
  );

  return response;
}
