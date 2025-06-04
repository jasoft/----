"use client";

import { useEffect, useState } from "react";

interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * NoSSR 组件 - 只在客户端渲染内容
 * 用于解决手机端浏览器插入额外标签导致的 hydration 问题
 */
export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * ClientOnly 组件 - NoSSR 的别名，语义更清晰
 */
export const ClientOnly = NoSSR;
