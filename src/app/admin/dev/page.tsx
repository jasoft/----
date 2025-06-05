"use client";

import { useState } from "react";
import Link from "next/link";

interface DevToolStatus {
  name: string;
  description: string;
  status: "unknown" | "success" | "error" | "warning";
  message?: string;
}

export default function DevToolsPage() {
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
      // 检查管理员配置
      const configResponse = await fetch("/api/check-admin-config");
      const configData = await configResponse.json();

      const configIndex = newStatuses.findIndex((s) => s.name === "管理员配置");
      if (configIndex !== -1) {
        newStatuses[configIndex] = {
          ...newStatuses[configIndex],
          status:
            configData.success && configData.config?.isFullyConfigured
              ? "success"
              : "error",
          message: configData.message || "配置检查失败",
        };
      }

      // 检查用户缓存表状态
      const cacheResponse = await fetch("/api/setup-user-cache");
      const cacheData = await cacheResponse.json();

      const cacheIndex = newStatuses.findIndex((s) => s.name === "用户缓存表");
      if (cacheIndex !== -1) {
        newStatuses[cacheIndex] = {
          ...newStatuses[cacheIndex],
          status: cacheData.success && cacheData.exists ? "success" : "warning",
          message:
            cacheData.message ||
            (cacheData.exists ? "集合已存在" : "集合不存在"),
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

      // PocketBase 连接状态（通过缓存测试间接检查）
      const pbIndex = newStatuses.findIndex(
        (s) => s.name === "PocketBase 连接",
      );
      if (pbIndex !== -1) {
        newStatuses[pbIndex] = {
          ...newStatuses[pbIndex],
          status: cacheData.success ? "success" : "error",
          message: cacheData.success ? "连接正常" : "连接失败",
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
      case "success":
        return "text-green-600 bg-green-100";
      case "error":
        return "text-red-600 bg-red-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "warning":
        return "⚠";
      default:
        return "?";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">开发者工具</h1>
        <p className="mt-2 text-gray-600">测试、调试和性能分析工具集合</p>
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {toolStatuses.map((tool, index) => (
            <div key={index} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">{tool.name}</h3>
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(tool.status)}`}
                >
                  {getStatusIcon(tool.status)}{" "}
                  {tool.status === "unknown"
                    ? "未知"
                    : tool.status === "success"
                      ? "正常"
                      : tool.status === "error"
                        ? "错误"
                        : "警告"}
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
        {/* 缓存管理 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold">缓存管理</h3>
          <p className="mb-4 text-sm text-gray-600">管理和配置认证缓存系统</p>
          <div className="space-y-2">
            <Link
              href="/admin/setup-cache"
              className="block w-full rounded bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
            >
              缓存设置
            </Link>
            <Link
              href="/admin/test-cache"
              className="block w-full rounded bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700"
            >
              快速测试
            </Link>
          </div>
        </div>

        {/* 性能测试 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold">性能测试</h3>
          <p className="mb-4 text-sm text-gray-600">测试和分析系统性能</p>
          <div className="space-y-2">
            <Link
              href="/admin/auth-performance"
              className="block w-full rounded bg-purple-600 px-4 py-2 text-center text-white hover:bg-purple-700"
            >
              认证性能测试
            </Link>
            <Link
              href="/admin/performance-test"
              className="block w-full rounded bg-indigo-600 px-4 py-2 text-center text-white hover:bg-indigo-700"
            >
              活动性能测试
            </Link>
          </div>
        </div>

        {/* 调试工具 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold">调试工具</h3>
          <p className="mb-4 text-sm text-gray-600">调试和诊断工具</p>
          <div className="space-y-2">
            <Link
              href="/admin/debug"
              className="block w-full rounded bg-gray-600 px-4 py-2 text-center text-white hover:bg-gray-700"
            >
              PocketBase 调试
            </Link>
            <a
              href="http://192.168.1.138:8090/_/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded bg-orange-600 px-4 py-2 text-center text-white hover:bg-orange-700"
            >
              PocketBase 管理界面
            </a>
          </div>
        </div>

        {/* API 测试 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold">API 测试</h3>
          <p className="mb-4 text-sm text-gray-600">测试各种 API 端点</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() =>
                fetch("/api/test-clerk-direct")
                  .then((r) => r.json())
                  .then(console.log)
              }
              className="block w-full rounded bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-600"
            >
              测试 Clerk Direct
            </button>
            <button
              type="button"
              onClick={() =>
                fetch("/api/test-cached-auth")
                  .then((r) => r.json())
                  .then(console.log)
              }
              className="block w-full rounded bg-green-500 px-4 py-2 text-center text-white hover:bg-green-600"
            >
              测试缓存认证
            </button>
          </div>
        </div>

        {/* 缓存操作 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold">缓存操作</h3>
          <p className="mb-4 text-sm text-gray-600">管理缓存数据</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() =>
                fetch("/api/clear-auth-cache", { method: "POST" }).then(() =>
                  alert("缓存已清除"),
                )
              }
              className="block w-full rounded bg-red-600 px-4 py-2 text-center text-white hover:bg-red-700"
            >
              清除认证缓存
            </button>
            <button
              type="button"
              onClick={() =>
                fetch("/api/fix-cache-permissions", { method: "POST" })
                  .then((r) => r.json())
                  .then((data) =>
                    alert(
                      data.success ? "权限已修复" : `修复失败: ${data.error}`,
                    ),
                  )
              }
              className="block w-full rounded bg-yellow-600 px-4 py-2 text-center text-white hover:bg-yellow-700"
            >
              修复缓存权限
            </button>
            <button
              type="button"
              onClick={() =>
                fetch("/api/recreate-user-cache", { method: "POST" })
                  .then((r) => r.json())
                  .then((data) => {
                    if (data.success) {
                      alert(
                        `集合重新创建成功！字段数量: ${data.collection.fieldsCount}`,
                      );
                      checkAllStatus(); // 重新检查状态
                    } else {
                      alert(`重新创建失败: ${data.error}`);
                    }
                  })
              }
              className="block w-full rounded bg-orange-600 px-4 py-2 text-center text-white hover:bg-orange-700"
            >
              重新创建集合
            </button>
            <button
              type="button"
              onClick={() =>
                fetch("/api/add-cache-fields", { method: "POST" })
                  .then((r) => r.json())
                  .then((data) => {
                    if (data.success) {
                      alert(
                        `字段添加成功！字段数量: ${data.collection.fieldsCount}`,
                      );
                      checkAllStatus(); // 重新检查状态
                    } else {
                      alert(`添加字段失败: ${data.error}`);
                    }
                  })
              }
              className="block w-full rounded bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700"
            >
              添加缺失字段
            </button>
            <button
              type="button"
              onClick={checkAllStatus}
              className="block w-full rounded bg-gray-500 px-4 py-2 text-center text-white hover:bg-gray-600"
            >
              刷新状态
            </button>
          </div>
        </div>

        {/* 文档链接 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold">文档</h3>
          <p className="mb-4 text-sm text-gray-600">查看相关文档和指南</p>
          <div className="space-y-2">
            <a
              href="/docs/auth-cache-system.md"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded bg-teal-600 px-4 py-2 text-center text-white hover:bg-teal-700"
            >
              缓存系统文档
            </a>
            <a
              href="/docs/quick-setup-user-cache.md"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded bg-cyan-600 px-4 py-2 text-center text-white hover:bg-cyan-700"
            >
              快速设置指南
            </a>
          </div>
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
