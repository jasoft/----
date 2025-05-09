"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            报名抽签系统
          </Link>

          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className={cn(
                "text-sm transition-colors hover:text-neutral-900",
                pathname === "/" ? "text-neutral-900" : "text-neutral-500",
              )}
            >
              活动列表
            </Link>
            <Link
              href="/admin"
              className={cn(
                "text-sm transition-colors hover:text-neutral-900",
                pathname?.startsWith("/admin")
                  ? "text-neutral-900"
                  : "text-neutral-500",
              )}
            >
              管理后台
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
