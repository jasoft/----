"use client";

import Link from "next/link";

export function BackButton() {
  return (
    <Link href="/admin" className="btn btn-ghost">
      返回
    </Link>
  );
}
