"use client";

import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");
import Link from "next/link";
import type { Activity, Registration } from "~/lib/pb";
import { formatDate } from "~/lib/utils";
import { Dialog } from "~/components/ui/dialog";
import { Card } from "~/components/ui/card";
import { NoSSR } from "~/components/ui/no-ssr";
import { useClientUrl } from "~/hooks/use-client-url";
import { ClockIcon, LinkIcon } from "@heroicons/react/24/outline";

interface ResultDisplayProps {
  activity: Activity;
  registrations: Registration[];
  winners: Registration[];
  isPending: boolean;
  isPublished: boolean;
}

export function ResultDisplay({
  activity,
  registrations,
  winners,
  isPending,
  isPublished,
}: ResultDisplayProps) {
  const formattedDeadline = formatDate(activity.deadline);
  const { getShortUrl, mounted: urlMounted } = useClientUrl();

  // 计算初始倒计时值
  // 计算倒计时，服务端渲染时不显示秒数
  const calculateTimeLeft = useCallback(
    (includeSeconds = false) => {
      try {
        // 确保在客户端环境下才进行精确计算
        if (typeof window === "undefined") {
          return "计算中...";
        }

        const now = dayjs();
        const end = dayjs(activity.deadline);

        // 验证日期有效性
        if (!end.isValid()) {
          console.warn("Invalid deadline:", activity.deadline);
          return "时间格式错误";
        }

        const diff = end.diff(now);

        if (diff <= 0) {
          return "已结束";
        }

        const duration = dayjs.duration(diff);
        const days = Math.floor(duration.asDays());
        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();

        let timeString = "";
        if (days > 0) timeString += `${days}天`;
        if (hours > 0) timeString += `${hours}小时`;
        if (minutes > 0) timeString += `${minutes}分钟`;
        if (includeSeconds) timeString += `${seconds}秒`;

        return timeString || (includeSeconds ? "1秒" : "不到1分钟");
      } catch (error) {
        console.warn("Time calculation error:", error);
        return "计算中...";
      }
    },
    [activity.deadline],
  );

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(false));

  useEffect(() => {
    // 使用 requestAnimationFrame 确保在浏览器准备好后再更新
    const updateTime = () => {
      try {
        setTimeLeft(calculateTimeLeft(true));
      } catch (error) {
        console.warn("Time calculation error:", error);
        setTimeLeft("计算中...");
      }
    };

    // 初始化时立即更新
    updateTime();

    const timer = setInterval(() => {
      try {
        const newTimeLeft = calculateTimeLeft(true);
        setTimeLeft(newTimeLeft);

        // 如果倒计时结束且没有中签者，则刷新页面触发抽签
        const hasWinners = registrations.some((reg) => reg.isWinner);
        if (newTimeLeft === "已结束" && !hasWinners) {
          clearInterval(timer);
          // 延迟一秒后刷新，确保用户能看到倒计时结束
          setTimeout(() => {
            try {
              window.location.reload();
            } catch (error) {
              console.error("Reload failed:", error);
              // 如果刷新失败，尝试重定向
              window.location.href = window.location.href;
            }
          }, 1000);
        }
      } catch (error) {
        console.warn("Timer update error:", error);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, registrations]);

  const registrationCount = registrations.length;
  const winnerCount = winners.length;

  useEffect(() => {
    if (!isPending && registrationCount > 0) {
      // 使用 requestAnimationFrame 确保在浏览器绘制完成后再显示弹窗
      const showDialog = () => {
        try {
          void Dialog.success(
            "抽签结果已公布",
            `本次活动共有 ${registrationCount} 人报名，${winnerCount} 人中签`,
          );
        } catch (error) {
          console.warn("Failed to show dialog:", error);
        }
      };

      const handle = window.requestAnimationFrame(() => {
        // 额外延迟以确保页面完全稳定
        setTimeout(showDialog, 1000);
      });

      return () => {
        window.cancelAnimationFrame(handle);
      };
    }
  }, [isPending, registrationCount, winnerCount]);

  if (!isPublished) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto max-w-screen-sm flex-1 space-y-6 px-4 py-6">
          <Card className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h1 className="text-2xl font-bold md:text-3xl">
                {activity.title}
              </h1>
            </div>
            <div className="py-4 text-center text-red-600">
              该活动尚未发布，暂时无法查看结果
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto max-w-screen-sm flex-1 space-y-4 px-4 pt-4 pb-24">
        {/* 活动概览区 */}
        <Card className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-3xl font-bold md:text-3xl">{activity.title}</h1>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-base font-medium text-white sm:text-sm ${
                winners.length > 0
                  ? "bg-gray-500"
                  : dayjs().isAfter(dayjs(activity.deadline))
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
            >
              {winners.length > 0
                ? "抽签完成"
                : dayjs().isAfter(dayjs(activity.deadline))
                  ? "报名结束"
                  : "报名中"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="flex items-center gap-2 text-base text-gray-600 sm:text-sm">
              <ClockIcon className="h-6 w-6 sm:h-5 sm:w-5" />
              <span>截止时间：{formattedDeadline}</span>
            </div>
            <div className="flex items-center gap-2 text-base text-red-600 sm:text-sm">
              <ClockIcon className="h-6 w-6 sm:h-5 sm:w-5" />
              <NoSSR
                fallback={<span className="font-semibold">加载中...</span>}
              >
                <span className="font-semibold">
                  {dayjs().isAfter(dayjs(activity.deadline)) ? (
                    <>
                      报名状态：
                      <span className="ml-1">已截止</span>
                    </>
                  ) : (
                    <>
                      距离结束：
                      <span className="ml-1">{timeLeft}</span>
                    </>
                  )}
                </span>
              </NoSSR>
            </div>
          </div>

          <div className="mt-4 border-t pt-4 text-gray-600">
            <div className="mb-2 flex items-center gap-2">
              <LinkIcon className="h-6 w-6 shrink-0 sm:h-5 sm:w-5" />
              <span className="text-base sm:text-sm">分享链接：</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NoSSR
                fallback={
                  <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1 text-base sm:text-sm">
                    加载中...
                  </code>
                }
              >
                <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1 text-base sm:text-sm">
                  {urlMounted ? getShortUrl(activity.id) : "加载中..."}
                </code>
              </NoSSR>
              <button
                type="button"
                onClick={async () => {
                  try {
                    // 确保在客户端环境下执行
                    if (!urlMounted) {
                      return;
                    }

                    const url = getShortUrl(activity.id);

                    await navigator.clipboard.writeText(url);

                    await Dialog.success(
                      "复制成功",
                      "链接已复制到剪贴板, 可以粘贴到其他APP分享",
                    );
                  } catch (error) {
                    console.error("Copy failed:", error);
                    await Dialog.error("复制失败", "请手动复制链接地址");
                  }
                }}
                className="text-base text-blue-600 hover:text-blue-700 sm:text-sm"
              >
                复制
              </button>
            </div>
          </div>
        </Card>

        {/* 活动说明折叠区 */}
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-center gap-1 text-base text-gray-500 select-none hover:text-gray-700 sm:text-sm">
            <span>查看活动详情</span>
            <svg
              className="h-6 w-6 rotate-0 transform transition-transform duration-200 ease-in-out group-open:rotate-180 sm:h-5 sm:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <Card className="mt-4 rounded-lg bg-gray-50 p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold sm:text-xl">活动描述</h2>
            <div className="prose max-w-none text-gray-600">
              <p className="text-base leading-relaxed whitespace-pre-wrap sm:text-sm">
                {activity.content}
              </p>
            </div>
          </Card>
        </details>

        {/* 报名者列表区 */}
        {registrationCount > 0 && (
          <Card className="rounded-lg bg-neutral-50 p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-2xl font-bold sm:text-xl">
                {winners.length > 0 ? "中签结果" : "已报名"}
              </h2>
              <p className="mt-2 text-base text-gray-600 sm:text-sm">
                报名人数：{registrationCount}/{activity.maxRegistrants}
                ，中签名额：{activity.winnersCount}
              </p>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {registrations.map((registration) => {
                const hasWon = winners.some((w) => w.id === registration.id);
                return (
                  <div
                    key={registration.id}
                    className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
                  >
                    <span className="text-base font-medium sm:text-sm">
                      {registration.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-base sm:text-sm ${
                          hasWon
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {winners.length > 0
                          ? hasWon
                            ? "已中签"
                            : "未中签"
                          : "已报名"}
                      </span>
                      <span className="text-base text-gray-500 sm:text-sm">
                        {dayjs(registration.created).format("MM月DD日 HH:mm")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {registrationCount === 0 && (
          <Card className="rounded-lg bg-neutral-50 p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-bold">已报名</h2>
              <p className="mt-2 text-sm text-gray-600">
                报名人数：0/{activity.maxRegistrants}，最终中签：
                {activity.winnersCount}
              </p>
            </div>
            <div className="text-center text-gray-600">
              暂无报名, 做第一位报名者吧！
            </div>
          </Card>
        )}

        {isPending && (
          <>
            {dayjs().isBefore(dayjs(activity.deadline)) && (
              <div className="fixed right-0 bottom-0 left-0 flex h-16 items-center justify-center bg-white/80 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-sm">
                <Link
                  href={`/activity/${activity.id}/register`}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:text-sm"
                >
                  立即报名
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
