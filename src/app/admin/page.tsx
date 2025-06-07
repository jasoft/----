"use client";

import { useState, useEffect, useCallback, type ReactElement } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { type Activity } from "~/lib/pb";
import { ManageActivityList } from "~/components/manage-activity-list";
import { activityService } from "~/services/activity";

type SortField = "created" | "deadline" | "registrations" | "title";
type SortOrder = "asc" | "desc";
type FilterStatus = "all" | "active" | "ended";

export default function AdminPage(): ReactElement {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 排序和筛选状态
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const toggleFilter = useCallback(() => {
    setIsFilterVisible((prev) => !prev);
  }, []);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      // 直接调用 activityService，不使用 Server Action
      const activities = await activityService.getAdminActivityList();
      setActivities(activities);

      const endTime = performance.now();
      console.log(`活动列表加载耗时: ${(endTime - startTime).toFixed(2)}ms`);
    } catch (err) {
      console.error("加载活动列表失败:", err);
      let errorMessage = "加载活动列表失败";
      if (err instanceof Error) {
        if (err.message.includes("network")) {
          errorMessage = "网络连接失败，请检查网络后重试";
        } else if (err.message.includes("timeout")) {
          errorMessage = "请求超时，请稍后重试";
        } else {
          errorMessage = `加载失败: ${err.message}`;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  // 延迟设置实时订阅，避免影响初始加载性能
  useEffect(() => {
    if (activities.length === 0 || isLoading) {
      return; // 等待数据加载完成
    }

    let unsubscribeFunc: (() => Promise<void>) | undefined;

    const setupSubscription = async () => {
      try {
        unsubscribeFunc = await activityService.subscribe(() => {
          void loadActivities();
        });
      } catch (error) {
        console.error("设置实时订阅失败:", error);
      }
    };

    // 延迟500ms设置订阅，确保初始渲染完成
    const timer = setTimeout(() => {
      void setupSubscription();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (unsubscribeFunc) {
        void unsubscribeFunc();
      }
    };
  }, [activities.length, isLoading, loadActivities]);

  // 数据处理函数
  const processActivities = (items: Activity[]) => {
    let result = [...items];

    // 搜索过滤
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 状态过滤
    if (filterStatus !== "all") {
      const now = new Date();
      result = result.filter((item) => {
        const isActive = new Date(item.deadline) > now;
        return filterStatus === "active" ? isActive : !isActive;
      });
    }

    // 排序
    result.sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case "created":
          compareResult =
            new Date(a.created).getTime() - new Date(b.created).getTime();
          break;
        case "deadline":
          compareResult =
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case "registrations":
          compareResult =
            (a.expand?.registrations_count ?? 0) -
            (b.expand?.registrations_count ?? 0);
          break;
        case "title":
          compareResult = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === "asc" ? compareResult : -compareResult;
    });

    return result;
  };

  const processedActivities = processActivities(activities);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="mb-2">
          <h1 className="text-2xl font-medium">活动管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理您的所有活动，查看报名情况和活动状态
          </p>
        </div>
        <div className="mb-4">
          <Link
            href="/admin/new"
            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            创建活动
          </Link>
        </div>
        {/* 移动端过滤切换按钮 */}
        <button
          type="button"
          onClick={toggleFilter}
          className="mb-4 flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 text-sm font-medium text-neutral-600 shadow-sm md:hidden"
        >
          筛选和排序
          {isFilterVisible ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>

        {/* 筛选和排序工具栏 */}
        <div
          className={`mb-6 rounded border border-gray-200 bg-white p-4 md:block ${isFilterVisible ? "block" : "hidden"}`}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-gray-500">
                搜索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索活动标题或内容"
                className="block w-full rounded border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-gray-500">
                状态筛选
              </label>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as FilterStatus)
                }
                className="block w-full rounded border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="活动状态筛选"
              >
                <option value="all">全部活动</option>
                <option value="active">进行中</option>
                <option value="ended">已结束</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-gray-500">
                排序依据
              </label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="block w-full rounded border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="排序字段选择"
              >
                <option value="created">创建时间</option>
                <option value="deadline">截止时间</option>
                <option value="registrations">报名人数</option>
                <option value="title">活动标题</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-gray-500">
                排序方式
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="block w-full rounded border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="排序方式选择"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <span className="ml-3 text-neutral-600">加载中...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="mb-3 text-center">
            <p className="text-red-600">{error}</p>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void loadActivities()}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              重试
            </button>
          </div>
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-lg text-neutral-600">暂无活动</p>
          <p className="mt-2 text-sm text-neutral-500">
            点击右上角按钮创建新活动
          </p>
        </div>
      ) : (
        <ManageActivityList
          activities={processedActivities}
          onDeleted={loadActivities}
        />
      )}
    </div>
  );
}
