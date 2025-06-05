import { getCachedCurrentUser } from "~/services/auth-cache-simple";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function TestCachePage() {
  // 测试缓存系统
  const startTime1 = performance.now();
  const cachedUser = await getCachedCurrentUser();
  const endTime1 = performance.now();

  // 测试直接 Clerk API
  const startTime2 = performance.now();
  const directUser = await currentUser();
  const endTime2 = performance.now();

  if (!cachedUser || !directUser) {
    redirect("/sign-in");
  }

  const cachedDuration = endTime1 - startTime1;
  const directDuration = endTime2 - startTime2;
  const improvement =
    directDuration > 0
      ? ((directDuration - cachedDuration) / directDuration) * 100
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">缓存系统测试</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 性能对比 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">性能对比</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>缓存系统:</span>
              <span className="font-mono text-green-600">
                {cachedDuration.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>直接 Clerk API:</span>
              <span className="font-mono text-blue-600">
                {directDuration.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>性能提升:</span>
              <span
                className={`font-mono ${improvement > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {improvement > 0 ? "+" : ""}
                {improvement.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 用户信息对比 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">用户信息对比</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">ID 一致:</span>
              <span
                className={`ml-2 ${cachedUser.id === directUser.id ? "text-green-600" : "text-red-600"}`}
              >
                {cachedUser.id === directUser.id ? "✓" : "✗"}
              </span>
            </div>
            <div>
              <span className="font-medium">邮箱一致:</span>
              <span
                className={`ml-2 ${
                  cachedUser.emailAddresses[0]?.emailAddress ===
                  directUser.emailAddresses[0]?.emailAddress
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {cachedUser.emailAddresses[0]?.emailAddress ===
                directUser.emailAddresses[0]?.emailAddress
                  ? "✓"
                  : "✗"}
              </span>
            </div>
            <div>
              <span className="font-medium">姓名一致:</span>
              <span
                className={`ml-2 ${
                  cachedUser.firstName === directUser.firstName &&
                  cachedUser.lastName === directUser.lastName
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {cachedUser.firstName === directUser.firstName &&
                cachedUser.lastName === directUser.lastName
                  ? "✓"
                  : "✗"}
              </span>
            </div>
          </div>
        </div>

        {/* 缓存用户详情 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">缓存用户信息</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">ID:</span> {cachedUser.id}
            </div>
            <div>
              <span className="font-medium">邮箱:</span>{" "}
              {cachedUser.emailAddresses[0]?.emailAddress}
            </div>
            <div>
              <span className="font-medium">姓名:</span> {cachedUser.firstName}{" "}
              {cachedUser.lastName}
            </div>
            <div>
              <span className="font-medium">头像:</span>{" "}
              {cachedUser.imageUrl ? "有" : "无"}
            </div>
          </div>
        </div>

        {/* 直接 API 用户详情 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">直接 API 用户信息</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">ID:</span> {directUser.id}
            </div>
            <div>
              <span className="font-medium">邮箱:</span>{" "}
              {directUser.emailAddresses[0]?.emailAddress}
            </div>
            <div>
              <span className="font-medium">姓名:</span> {directUser.firstName}{" "}
              {directUser.lastName}
            </div>
            <div>
              <span className="font-medium">头像:</span>{" "}
              {directUser.imageUrl ? "有" : "无"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-x-4">
        <a
          href="/admin/auth-performance"
          className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          详细性能测试
        </a>
        <a
          href="/admin"
          className="inline-block rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          返回管理页面
        </a>
      </div>
    </div>
  );
}
