import { NavLinks } from "./nav-links";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { env } from "~/env.mjs";

export function Nav() {
  const isTestMode = env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST === "true";

  return (
    <div className="sticky top-0 z-50 w-full">
      <div className="navbar bg-base-100 border-b border-neutral-200 shadow-sm">
        <div className="navbar-start">
          <div className="text-xl font-bold">活动报名系统</div>
        </div>
        <div className="navbar-center">
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
