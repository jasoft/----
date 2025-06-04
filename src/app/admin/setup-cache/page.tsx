"use client";

import { useState } from "react";

interface SetupStatus {
  exists: boolean;
  created?: boolean;
  message: string;
  collectionId?: string;
  recordCount?: number;
}

export default function SetupCachePage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/setup-user-cache");
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
      } else {
        setError(data.error || "检查状态失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setIsLoading(false);
    }
  };

  const createCollection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/setup-user-cache", {
        method: "POST"
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
      } else {
        setError(data.error || "创建集合失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/clear-auth-cache", {
        method: "POST"
      });
      const data = await response.json();
      
      if (data.success) {
        alert("缓存已清除");
        await checkStatus(); // 重新检查状态
      } else {
        setError(data.error || "清除缓存失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">用户缓存设置</h1>
      
      <div className="space-y-6">
        {/* 状态检查 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">集合状态检查</h2>
          
          <button
            onClick={checkStatus}
            disabled={isLoading}
            className="mb-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "检查中..." : "检查状态"}
          </button>

          {status && (
            <div className="mt-4 space-y-2">
              <div className={`p-3 rounded ${status.exists ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                <div className="font-medium">
                  {status.exists ? "✓ 集合已存在" : "⚠ 集合不存在"}
                </div>
                <div className="text-sm">{status.message}</div>
                {status.recordCount !== undefined && (
                  <div className="text-sm">缓存记录数量: {status.recordCount}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 集合创建 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">创建用户缓存集合</h2>
          
          <p className="mb-4 text-sm text-gray-600">
            如果 user_cache 集合不存在，点击下面的按钮自动创建。
          </p>
          
          <button
            onClick={createCollection}
            disabled={isLoading || (status?.exists === true)}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? "创建中..." : "创建集合"}
          </button>

          {status?.exists && (
            <p className="mt-2 text-sm text-green-600">
              集合已存在，无需重复创建
            </p>
          )}
        </div>

        {/* 缓存管理 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">缓存管理</h2>
          
          <div className="space-x-4">
            <button
              onClick={clearCache}
              disabled={isLoading}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "清除中..." : "清除所有缓存"}
            </button>
            
            <a
              href="/admin/auth-performance"
              className="inline-block rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              性能测试
            </a>
            
            <a
              href="/admin/test-cache"
              className="inline-block rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              快速测试
            </a>
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-medium text-red-800">错误</h3>
            <p className="text-red-700">{error}</p>
            <div className="mt-2 text-sm text-red-600">
              如果自动创建失败，请参考{" "}
              <a 
                href="/docs/setup-user-cache-manual.md" 
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                手动设置指南
              </a>
            </div>
          </div>
        )}

        {/* 说明文档 */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-4 text-lg font-semibold">说明</h2>
          
          <div className="space-y-2 text-sm text-gray-700">
            <p>• 用户缓存系统通过本地 PocketBase 缓存 Clerk 用户信息</p>
            <p>• 缓存分为内存缓存(5分钟)和数据库缓存(30分钟)两层</p>
            <p>• 可以显著减少对 Clerk API 的调用，提高响应速度</p>
            <p>• 如果缓存失败，系统会自动回退到直接调用 Clerk API</p>
          </div>

          <div className="mt-4">
            <a
              href="/docs/auth-cache-system.md"
              className="text-blue-600 hover:text-blue-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              查看完整文档 →
            </a>
          </div>
        </div>

        {/* 返回按钮 */}
        <div className="text-center">
          <a
            href="/admin"
            className="inline-block rounded bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
          >
            返回管理页面
          </a>
        </div>
      </div>
    </div>
  );
}
