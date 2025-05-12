"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminLogout } from "~/lib/pb";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // 调用登出 API
        const response = await fetch("/api/admin/logout", {
          method: "POST", // 使用 POST 方法更合适
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          adminLogout(); // 清除客户端状态
          router.push("/"); // 重定向到首页
        }
      } catch (error) {
        console.error("登出失败:", error);
        router.push("/admin"); // 失败时返回管理页面
      }
    };

    void performLogout();
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <p className="text-center">正在退出登录...</p>
    </div>
  );
}
