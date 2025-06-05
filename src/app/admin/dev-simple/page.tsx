"use client";

import { useState } from "react";
import Link from "next/link";

interface DevToolStatus {
  name: string;
  description: string;
  status: "unknown" | "success" | "error" | "warning";
  message?: string;
}

export default function DevToolsSimplePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [toolStatuses, setToolStatuses] = useState<DevToolStatus[]>([
    {
      name: "内存缓存",
      description: "检查内存缓存系统状态",
      status: "unknown",
    },
    {
      name: "认证缓存",
      description: "测试认证缓存系统性能",
      status: "unknown",
    },
  ]);

  const checkAllStatus = async () => {
    setIsLoading(true);
    const newStatuses = [...toolStatuses];

    try {
      // 检查内存缓存状态
      const cacheStatsResponse = await fetch("/api/cache-stats");
      const cacheStatsData = await cacheStatsResponse.json();

      const cacheIndex = newStatuses.findIndex((s) => s.name === "内存缓存");
      if (cacheIndex !== -1) {
        newStatuses[cacheIndex] = {
          ...newStatuses[cacheIndex],
          status: cacheStatsData.success ? "success" : "error",
          message: cacheStatsData.success
            ? `${cacheStatsData.stats.validEntries} 个有效条目，${cacheStatsData.stats.cacheDurationMinutes} 分钟缓存`
            : "缓存状态检查失败",
        };
      }

      // 简单的认证缓存测试
      const authResponse = await fetch("/api/test-cached-auth");
      const authData = await authResponse.json();

      const authIndex = newStatuses.findIndex((s) => s.name === "认证缓存");
      if (authIndex !== -1) {
        newStatuses[authIndex] = {
          ...newStatuses[authIndex],
          status: authData.success ? "success" : "error",
          message: authData.success
            ? `响应时间: ${authData.duration?.toFixed(2)}ms`
            : "测试失败",
        };
      }
    } catch (error) {
      console.error("检查状态失败:", error);
    } finally {
      setToolStatuses(newStatuses);
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "text-green-600 bg-green-100";
      case "error": return "text-red-600 bg-red-100";
      case "warning": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return "✓";
      case "error": return "✗";
      case "warning": return "⚠";
      default: return "?";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">开发者工具</h1>
        <p className="mt-2 text-gray-600">
          简化的认证缓存测试和管理工具
        </p>
      </div>

      {/* 系统状态概览 */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">系统状态</h2>
          <button
            type="button"
            onClick={checkAllStatus}
            disabled={isLoading}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "检查中..." : "检查状态"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {toolStatuses.map((tool, index) => (
            <div key={index} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">{tool.name}</h3>
                <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(tool.status)}`}>
                  {getStatusIcon(tool.status)} {tool.status === "unknown" ? "未知" : 
                    tool.status === "success" ? "正常" : 
                    tool.status === "error" ? "错误" : "警告"}
                </span>
              </div>
              <p className="text-sm text-gray-600">{tool.description}</p>
              {tool.message && (
                <p className="mt-2 text-xs text-gray-500">{tool.message}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 工具链接 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 性能测试 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold">性能测试</h3>
          <p className="mb-4 text-sm text-gray-600">
            测试和分析认证缓存性能
          </p>
          <div className="space-y-2">
            <Link
              href="/admin/auth-performance"
              className="block w-full rounded bg-purple-600 px-4 py-2 text-center text-white hover:bg-purple-700"
            >
              认证性能测试
            </Link>
            <Link
              href="/admin/test-cache"
              className="block w-full rounded bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700"
            >
              快速测试
            </Link>
          </div>
        </div>

        {/* API 测试 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold">API 测试</h3>
          <p className="mb-4 text-sm text-gray-600">
            测试各种 API 端点
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fetch("/api/test-clerk-direct").then(r => r.json()).then(console.log)}
              className="block w-full rounded bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-600"
            >
              测试 Clerk Direct
            </button>
            <button
              type="button"
              onClick={() => fetch("/api/test-cached-auth").then(r => r.json()).then(console.log)}
              className="block w-full rounded bg-green-500 px-4 py-2 text-center text-white hover:bg-green-600"
            >
              测试缓存认证
            </button>
          </div>
        </div>

        {/* 缓存操作 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold">缓存操作</h3>
          <p className="mb-4 text-sm text-gray-600">
            管理内存缓存数据
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fetch("/api/clear-auth-cache", { method: "POST" }).then(() => alert("缓存已清除"))}
              className="block w-full rounded bg-red-600 px-4 py-2 text-center text-white hover:bg-red-700"
            >
              清除内存缓存
            </button>
            <button
              type="button"
              onClick={() => fetch("/api/cache-stats").then(r => r.json()).then(data => alert(`缓存统计: ${data.stats.validEntries} 个有效条目`))}
              className="block w-full rounded bg-gray-500 px-4 py-2 text-center text-white hover:bg-gray-600"
            >
              查看缓存统计
            </button>
          </div>
        </div>
      </div>

      {/* 说明 */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 text-lg font-semibold">系统说明</h2>
        
        <div className="space-y-2 text-sm text-gray-700">
          <p>• <strong>内存缓存</strong>: 5分钟有效期，显著提升重复访问性能</p>
          <p>• <strong>自动回退</strong>: 缓存失败时自动使用 Clerk API</p>
          <p>• <strong>性能提升</strong>: 缓存命中时响应时间从几百毫秒降至几毫秒</p>
          <p>• <strong>安全可靠</strong>: 无数据库依赖，简单稳定</p>
        </div>
      </div>

      {/* 返回按钮 */}
      <div className="mt-8 text-center">
        <Link
          href="/admin"
          className="inline-block rounded bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
        >
          返回管理页面
        </Link>
      </div>
    </div>
  );
}
