"use client";

import { useState } from "react";
import { activityService } from "~/services/activity";

export default function PerformanceTestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setResults([]);

    const testResults: string[] = [];

    // 测试1: 首次加载（无缓存）
    try {
      const start1 = performance.now();
      await activityService.getAdminActivityList();
      const end1 = performance.now();
      testResults.push(`首次加载（无缓存）: ${(end1 - start1).toFixed(2)}ms`);
    } catch (error) {
      testResults.push(`首次加载失败: ${String(error)}`);
    }

    // 等待100ms
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 测试2: 第二次加载（有缓存）
    try {
      const start2 = performance.now();
      await activityService.getAdminActivityList();
      const end2 = performance.now();
      testResults.push(`第二次加载（有缓存）: ${(end2 - start2).toFixed(2)}ms`);
    } catch (error) {
      testResults.push(`第二次加载失败: ${String(error)}`);
    }

    // 测试3: 连续5次加载
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      try {
        const start = performance.now();
        await activityService.getAdminActivityList();
        const end = performance.now();
        times.push(end - start);
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        testResults.push(`第${i + 1}次连续加载失败: ${String(error)}`);
      }
    }

    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      testResults.push(
        `连续5次加载 - 平均: ${avg.toFixed(2)}ms, 最小: ${min.toFixed(2)}ms, 最大: ${max.toFixed(2)}ms`,
      );
    }

    setResults(testResults);
    setIsRunning(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">性能测试</h1>

      <div className="mb-6">
        <button
          type="button"
          onClick={runPerformanceTest}
          disabled={isRunning}
          className="btn btn-primary"
        >
          {isRunning ? "测试中..." : "开始性能测试"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">测试结果</h2>
          <ul className="space-y-2">
            {results.map((result, index) => (
              <li key={index} className="font-mono text-sm">
                {result}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
