"use client";

import { useState } from "react";
import { activityService } from "~/services/activity";
import { getPocketBaseClientInstance } from "~/lib/pb";

// API 响应类型定义
interface AuthResponse {
  token: string;
  record?: unknown;
}

interface ListResponse {
  items?: unknown[];
  page?: number;
  perPage?: number;
  totalItems?: number;
  totalPages?: number;
}

interface CacheResponse {
  success: boolean;
  message?: string;
  exists?: boolean;
}

interface TestResponse {
  success: boolean;
  duration?: number;
  user?: unknown;
  message?: string;
}

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const testDirectPocketBase = async () => {
    setIsRunning(true);
    setLogs([]);

    try {
      addLog("开始测试直接 PocketBase 调用");

      const pb = getPocketBaseClientInstance();

      // 测试1: 认证
      addLog("开始认证...");
      const authStart = performance.now();
      await pb.collection("users").authWithPassword("admin", "xlu_omKO3lMLPVk");
      const authEnd = performance.now();
      addLog(`认证完成，耗时: ${(authEnd - authStart).toFixed(2)}ms`);

      // 测试2: 获取活动列表
      addLog("开始获取活动列表...");
      const listStart = performance.now();
      const records = await pb.collection("activities").getList(1, 100, {
        sort: "-created",
        expand: "registrations",
      });
      const listEnd = performance.now();
      addLog(
        `获取活动列表完成，耗时: ${(listEnd - listStart).toFixed(2)}ms，数量: ${records.items.length}`,
      );

      // 测试3: 使用 activityService
      addLog("开始使用 activityService...");
      const serviceStart = performance.now();
      const activities = await activityService.getAdminActivityList();
      const serviceEnd = performance.now();
      addLog(
        `activityService 完成，耗时: ${(serviceEnd - serviceStart).toFixed(2)}ms，数量: ${activities.length}`,
      );

      addLog("所有测试完成");
    } catch (error) {
      addLog(`测试失败: ${String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testNetworkOnly = async () => {
    setIsRunning(true);
    setLogs([]);

    try {
      addLog("开始网络测试");

      // 测试基本连接
      const healthStart = performance.now();
      const response = await fetch("http://192.168.1.138:8090/api/health");
      const healthEnd = performance.now();
      addLog(
        `健康检查耗时: ${(healthEnd - healthStart).toFixed(2)}ms，状态: ${response.status}`,
      );

      // 测试认证端点
      const authStart = performance.now();
      const authResponse = await fetch(
        "http://192.168.1.138:8090/api/collections/users/auth-with-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identity: "admin",
            password: "xlu_omKO3lMLPVk",
          }),
        },
      );
      const authEnd = performance.now();
      addLog(
        `认证请求耗时: ${(authEnd - authStart).toFixed(2)}ms，状态: ${authResponse.status}`,
      );

      if (authResponse.ok) {
        const authData = (await authResponse.json()) as AuthResponse;
        const token = authData.token;

        // 测试活动列表请求
        const listStart = performance.now();
        const listResponse = await fetch(
          "http://192.168.1.138:8090/api/collections/activities/records?sort=-created&expand=registrations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const listEnd = performance.now();
        addLog(
          `活动列表请求耗时: ${(listEnd - listStart).toFixed(2)}ms，状态: ${listResponse.status}`,
        );

        if (listResponse.ok) {
          const listData = (await listResponse.json()) as ListResponse;
          addLog(`获取到 ${listData.items?.length ?? 0} 个活动`);
        }
      }
    } catch (error) {
      addLog(`网络测试失败: ${String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testAuthCache = async () => {
    setIsRunning(true);
    setLogs([]);

    try {
      addLog("开始测试认证缓存系统");

      // 测试缓存状态
      addLog("检查缓存表状态...");
      const cacheStatusStart = performance.now();
      const cacheResponse = await fetch("/api/setup-user-cache");
      const cacheStatusEnd = performance.now();
      const cacheData = (await cacheResponse.json()) as CacheResponse;
      addLog(
        `缓存状态检查耗时: ${(cacheStatusEnd - cacheStatusStart).toFixed(2)}ms`,
      );
      addLog(`缓存状态: ${cacheData.message ?? "未知"}`);

      // 测试 Clerk Direct
      addLog("测试 Clerk Direct API...");
      const clerkStart = performance.now();
      const clerkResponse = await fetch("/api/test-clerk-direct");
      const clerkEnd = performance.now();
      const clerkData = (await clerkResponse.json()) as TestResponse;
      addLog(`Clerk Direct 耗时: ${(clerkEnd - clerkStart).toFixed(2)}ms`);
      if (clerkData.success) {
        addLog(
          `Clerk API 内部耗时: ${clerkData.duration?.toFixed(2) ?? "未知"}ms`,
        );
      }

      // 测试缓存认证
      addLog("测试缓存认证系统...");
      const cachedStart = performance.now();
      const cachedResponse = await fetch("/api/test-cached-auth");
      const cachedEnd = performance.now();
      const cachedData = (await cachedResponse.json()) as TestResponse;
      addLog(`缓存认证耗时: ${(cachedEnd - cachedStart).toFixed(2)}ms`);
      if (cachedData.success) {
        addLog(
          `缓存系统内部耗时: ${cachedData.duration?.toFixed(2) ?? "未知"}ms`,
        );
      }

      // 性能对比
      if (
        clerkData.success &&
        cachedData.success &&
        clerkData.duration &&
        cachedData.duration
      ) {
        const improvement =
          ((clerkData.duration - cachedData.duration) / clerkData.duration) *
          100;
        addLog(`性能提升: ${improvement.toFixed(1)}%`);
      }

      addLog("认证缓存测试完成");
    } catch (error) {
      addLog(`认证缓存测试失败: ${String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          PocketBase 调试工具
        </h1>
        <p className="mt-2 text-gray-600">
          测试 PocketBase 连接、性能和认证缓存系统
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={testDirectPocketBase}
          disabled={isRunning}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? "测试中..." : "测试 PocketBase SDK"}
        </button>

        <button
          type="button"
          onClick={testNetworkOnly}
          disabled={isRunning}
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isRunning ? "测试中..." : "测试原始网络请求"}
        </button>

        <button
          type="button"
          onClick={testAuthCache}
          disabled={isRunning}
          className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {isRunning ? "测试中..." : "测试认证缓存"}
        </button>

        <button
          type="button"
          onClick={() => setLogs([])}
          disabled={isRunning}
          className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
        >
          清除日志
        </button>

        <a
          href="/admin/dev"
          className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
        >
          返回开发者工具
        </a>
      </div>

      {logs.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">调试日志</h2>
          <div className="max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1 font-mono text-sm">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
