"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { type Activity } from "~/lib/pb";
import { ManageActivityList } from "~/components/manage-activity-list";
import { activityService } from "~/services/activity";

type SortField = "created" | "deadline" | "registrations" | "title";
type SortOrder = "asc" | "desc";
type FilterStatus = "all" | "active" | "ended";

export default function AdminPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 排序和筛选状态
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await activityService.getAdminActivityList();
      setActivities(items);
      setRetryCount(0);
    } catch (err) {
      let errorMessage = "加载活动列表失败";

      if (err instanceof Error) {
        if (err.message.includes("认证已过期")) {
          errorMessage = "管理员登录已过期，请重新登录";
        } else if (err.message.includes("network")) {
          errorMessage = "网络连接失败，请检查网络后重试";
        } else if (err.message.includes("timeout")) {
          errorMessage = "请求超时，请稍后重试";
        } else {
          errorMessage = `加载失败: ${err.message}`;
        }
      }

      setError(errorMessage);

      if (window.innerWidth < 768) {
        setRetryCount((prev) => prev + 1);

        if (retryCount >= 2) {
          alert("多次加载失败，请稍后再试或联系管理员");
        } else {
          alert(errorMessage + "\n\n下拉刷新页面可重试");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [retryCount]);

  // 初始加载
  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  // 添加下拉刷新支持
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch?.clientY !== undefined) {
        touchStartY = touch.clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (touch?.clientY !== undefined) {
        touchEndY = touch.clientY;
        const swipeDistance = touchEndY - touchStartY;

        if (window.scrollY === 0 && swipeDistance > minSwipeDistance) {
          void loadActivities();
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [loadActivities]);

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

  // 统计数据计算
  const stats = {
    total: activities.length,
    active: activities.filter((a) => new Date(a.deadline) > new Date()).length,
    totalRegistrations: activities.reduce(
      (sum, a) => sum + (a.expand?.registrations_count ?? 0),
      0,
    ),
  };

  const processedActivities = processActivities(activities);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">活动管理</h1>
          <Link href="/admin/new" className="btn btn-primary">
            创建活动
          </Link>
        </div>

        {/* 数据统计 */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-neutral-500">活动总数</h3>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-neutral-500">进行中活动</h3>
            <p className="mt-1 text-2xl font-bold">{stats.active}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-neutral-500">总报名人数</h3>
            <p className="mt-1 text-2xl font-bold">
              {stats.totalRegistrations}
            </p>
          </div>
        </div>

        {/* 筛选和排序工具栏 */}
        <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-neutral-500">
                搜索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索活动标题或内容"
                className="input input-bordered w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-neutral-500">
                状态
              </label>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as FilterStatus)
                }
                className="select select-bordered w-full"
              >
                <option value="all">全部</option>
                <option value="active">进行中</option>
                <option value="ended">已结束</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-neutral-500">
                排序字段
              </label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="select select-bordered w-full"
              >
                <option value="created">创建时间</option>
                <option value="deadline">截止时间</option>
                <option value="registrations">报名人数</option>
                <option value="title">活动标题</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-neutral-500">
                排序方式
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="select select-bordered w-full"
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
            <p className="mt-2 text-sm text-red-500">
              {retryCount >= 2
                ? "请尝试重新登录管理员账户"
                : "点击下方按钮重试，或下拉页面刷新"}
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => void loadActivities()}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              重试
            </button>
            {retryCount >= 2 && (
              <Link
                href="/"
                className="rounded bg-neutral-600 px-4 py-2 text-white hover:bg-neutral-700"
              >
                返回首页
              </Link>
            )}
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
    </main>
  );
}
