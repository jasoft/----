import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // 清除 cookie，同时设置多个属性确保彻底清除
  const cookieOptions = {
    name: "pb_auth",
    value: "",
    expires: new Date(0),
    path: "/",
    domain: process.env.NEXT_PUBLIC_DOMAIN ?? undefined,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  };

  response.cookies.set(cookieOptions);

  // 清除所有相关的cookie
  response.headers.append(
    "Set-Cookie",
    `pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${cookieOptions.domain ?? ""}`,
  );
  response.headers.append(
    "Set-Cookie",
    `pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );

  return response;
}

// 处理预检请求
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
