"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "~/lib/utils";

export function NavLinks() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="flex items-center space-x-2">
      <Link
        href="/user"
        className={cn("btn btn-ghost", isActive("/user") && "btn-active")}
      >
        活动列表
      </Link>
      <Link
        href="/admin"
        className={cn("btn btn-ghost", isActive("/admin") && "btn-active")}
      >
        后台管理
      </Link>
    </div>
  );
}
