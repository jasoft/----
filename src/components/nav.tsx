import { NavLinks } from "./nav-links";

export function Nav() {
  return (
    <div className="sticky top-0 z-50 w-full">
      <div className="navbar bg-base-100 border-b border-neutral-200 shadow-sm">
        <div className="navbar-start">
          <div className="text-xl font-bold">活动报名系统</div>
        </div>
        <div className="navbar-center">
          <NavLinks />
        </div>
        <div className="navbar-end">{/* 移除了认证导航 */}</div>
      </div>
    </div>
  );
}
