"use client";
import { NavLinks } from "./nav-links";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { env } from "~/env.mjs";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const isTestMode = env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST === "true";
  const isActivityPage = pathname?.includes("/activity/");

  // 测试模式下使用简单导航栏
  if (isTestMode) {
    if (isActivityPage) {
      return null;
    }
    return (
      <div className="sticky top-0 z-50 w-full">
        <div className="navbar bg-base-100 border-b border-neutral-200 shadow-sm">
          <div className="navbar-start">
            <NavLinks />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        <div className="sticky top-0 z-50 w-full">
          <div className="navbar bg-base-100 border-b border-neutral-200 shadow-sm">
            <div className="navbar-start">
              <NavLinks />
            </div>
            <div className="navbar-end space-x-4">
              <UserButton />
            </div>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        {!isActivityPage && (
          <div className="sticky top-0 z-50 w-full">
            <div className="navbar bg-base-100 border-b border-neutral-200 shadow-sm">
              <div className="navbar-start">
                <NavLinks />
              </div>
              <div className="navbar-end space-x-4">
                <SignInButton>
                  <button className="btn btn-primary">登录</button>
                </SignInButton>
              </div>
            </div>
          </div>
        )}
      </SignedOut>
    </>
  );
}
