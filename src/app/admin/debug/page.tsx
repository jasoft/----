"use client";

import { useState } from "react";
import { activityService } from "~/services/activity";
import { getPocketBaseClientInstance } from "~/lib/pb";

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    const timestamp =
      new Date().toISOString().split("T")[1]?.slice(0, -1) ??
      new Date().toLocaleTimeString();
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
      addLog(`测试失败: ${error}`);
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
        const authData = await authResponse.json();
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
          const listData = await listResponse.json();
          addLog(`获取到 ${listData.items?.length || 0} 个活动`);
        }
      }
    } catch (error) {
      addLog(`网络测试失败: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">性能调试</h1>

      <div className="mb-6 space-x-4">
        <button
          onClick={testDirectPocketBase}
          disabled={isRunning}
          className="btn btn-primary"
        >
          {isRunning ? "测试中..." : "测试 PocketBase SDK"}
        </button>

        <button
          onClick={testNetworkOnly}
          disabled={isRunning}
          className="btn btn-secondary"
        >
          {isRunning ? "测试中..." : "测试原始网络请求"}
        </button>

        <button
          onClick={() => setLogs([])}
          disabled={isRunning}
          className="btn btn-outline"
        >
          清除日志
        </button>
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
