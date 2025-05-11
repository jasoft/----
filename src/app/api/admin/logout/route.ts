import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json({ success: true });

  // 设置cookie过期
  response.cookies.set({
    name: "pb_auth",
    value: "",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
