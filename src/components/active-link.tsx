"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "~/lib/utils";
import type { ReactNode } from "react";

interface ActiveLinkProps {
  href: string;
  children: ReactNode;
}

export function ActiveLink({ href, children }: ActiveLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "inline-block rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-neutral-800 text-white"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
      )}
    >
      {children}
    </Link>
  );
}
