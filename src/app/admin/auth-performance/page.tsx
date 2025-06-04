"use client";

import { useState } from "react";

interface PerformanceResult {
  method: string;
  duration: number;
  success: boolean;
  error?: string;
  userInfo?: {
    id: string;
    email: string;
    name: string;
  };
}

export default function AuthPerformancePage() {
  const [results, setResults] = useState<PerformanceResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testClerkDirect = async (): Promise<PerformanceResult> => {
    const startTime = performance.now();
    try {
      const response = await fetch("/api/test-clerk-direct");
      const endTime = performance.now();
      
      if (response.ok) {
        const data = await response.json();
        return {
          method: "Clerk Direct API",
          duration: endTime - startTime,
          success: true,
          userInfo: data.user ? {
            id: data.user.id,
            email: data.user.emailAddresses[0]?.emailAddress || "",
            name: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim(),
          } : undefined,
        };
      } else {
        return {
          method: "Clerk Direct API",
          duration: endTime - startTime,
          success: false,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      const endTime = performance.now();
      return {
        method: "Clerk Direct API",
        duration: endTime - startTime,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const testCachedAuth = async (): Promise<PerformanceResult> => {
    const startTime = performance.now();
    try {
      const response = await fetch("/api/test-cached-auth");
      const endTime = performance.now();
      
      if (response.ok) {
        const data = await response.json();
        return {
          method: "Cached Auth",
          duration: endTime - startTime,
          success: true,
          userInfo: data.user ? {
            id: data.user.id,
            email: data.user.emailAddresses[0]?.emailAddress || "",
            name: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim(),
          } : undefined,
        };
      } else {
        return {
          method: "Cached Auth",
          duration: endTime - startTime,
          success: false,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      const endTime = performance.now();
      return {
        method: "Cached Auth",
        duration: endTime - startTime,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    const testResults: PerformanceResult[] = [];
    
    // 测试1: Clerk Direct API (3次)
    for (let i = 0; i < 3; i++) {
      const result = await testClerkDirect();
      testResults.push({ ...result, method: `${result.method} #${i + 1}` });
      await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟
    }
    
    // 测试2: Cached Auth (3次)
    for (let i = 0; i < 3; i++) {
      const result = await testCachedAuth();
      testResults.push({ ...result, method: `${result.method} #${i + 1}` });
      await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟
    }
    
    setResults(testResults);
    setIsRunning(false);
  };

  const clearCache = async () => {
    try {
      const response = await fetch("/api/clear-auth-cache", { method: "POST" });
      if (response.ok) {
        alert("缓存已清除");
      } else {
        alert("清除缓存失败");
      }
    } catch (error) {
      alert("清除缓存失败: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const getAverageTime = (method: string) => {
    const methodResults = results.filter(r => r.method.includes(method) && r.success);
    if (methodResults.length === 0) return 0;
    return methodResults.reduce((sum, r) => sum + r.duration, 0) / methodResults.length;
  };

  const clerkAvg = getAverageTime("Clerk Direct API");
  const cachedAvg = getAverageTime("Cached Auth");
  const improvement = clerkAvg > 0 && cachedAvg > 0 ? ((clerkAvg - cachedAvg) / clerkAvg * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">认证性能测试</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={runPerformanceTest}
          disabled={isRunning}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? "测试中..." : "开始性能测试"}
        </button>
        
        <button
          onClick={clearCache}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          清除缓存
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-6">
          {/* 性能统计 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">性能统计</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {clerkAvg.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">Clerk Direct 平均</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {cachedAvg.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">Cached Auth 平均</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${improvement > 0 ? "text-green-600" : "text-red-600"}`}>
                  {improvement > 0 ? "+" : ""}{improvement.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">性能提升</div>
              </div>
            </div>
          </div>

          {/* 详细结果 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">详细结果</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">方法</th>
                    <th className="text-left py-2">耗时</th>
                    <th className="text-left py-2">状态</th>
                    <th className="text-left py-2">用户信息</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{result.method}</td>
                      <td className="py-2">
                        <span className={`font-mono ${
                          result.method.includes("Cached") ? "text-green-600" : "text-blue-600"
                        }`}>
                          {result.duration.toFixed(2)}ms
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.success 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {result.success ? "成功" : "失败"}
                        </span>
                      </td>
                      <td className="py-2">
                        {result.success && result.userInfo ? (
                          <div className="text-xs">
                            <div>{result.userInfo.name || "无名称"}</div>
                            <div className="text-gray-500">{result.userInfo.email}</div>
                          </div>
                        ) : result.error ? (
                          <span className="text-red-600 text-xs">{result.error}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">无数据</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
