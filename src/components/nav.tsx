"use client";
import { NavLinks } from "./nav-links";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { env } from "~/env.mjs";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const isTestMode = env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST === "true";

  // 如果是结果页面则不显示导航栏
  if (pathname?.includes("/activity/")) {
    return null;
  }
  return (
    <div className="sticky top-0 z-50 w-full">
      <div className="navbar bg-base-100 border-b border-neutral-200 shadow-sm">
        <div className="navbar-start">
          <NavLinks />
        </div>

        <div className="navbar-end space-x-4">
          {!isTestMode && (
            <>
              <SignedOut>
                <SignInButton>
                  <button className="btn btn-primary">登录</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
