"use client";

import { useEffect, useState } from "react";

/**
 * 客户端 URL hook
 * 用于在客户端安全地获取当前页面的 URL 信息
 * 避免服务端渲染时的 window 未定义错误
 */
export function useClientUrl() {
  const [origin, setOrigin] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      setMounted(true);
    }
  }, []);

  return {
    origin,
    mounted,
    /**
     * 生成短链接 URL
     */
    getShortUrl: (activityId: string) => {
      if (!mounted || !origin) {
        return "";
      }
      return `${origin}/s/${activityId}`;
    },
    /**
     * 生成完整的活动结果页面 URL
     */
    getResultUrl: (activityId: string) => {
      if (!mounted || !origin) {
        return "";
      }
      return `${origin}/activity/${activityId}/result`;
    },
  };
}
