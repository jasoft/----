"use client";

import { useEffect, useState } from "react";
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
import { ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";

interface ResultDisplayProps {
  activity: Activity;
  registrations: Registration[];
  winners: Registration[];
  isPending: boolean;
}

export function ResultDisplay({
  activity,
  registrations,
  winners,
  isPending,
}: ResultDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const formattedDeadline = formatDate(activity.deadline);

  // 计算初始倒计时值
  // 计算倒计时，服务端渲染时不显示秒数
  const calculateTimeLeft = (includeSeconds = false) => {
    const now = dayjs();
    const end = dayjs(activity.deadline);
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
  };

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(false));

  useEffect(() => {
    setMounted(true);
    // 初始化时立即更新为包含秒数的显示
    setTimeLeft(calculateTimeLeft(true));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(true));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto flex-1 space-y-6 px-4 py-6">
        {/* 活动概览区 */}
        <Card className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-2xl font-bold md:text-3xl">{activity.title}</h1>
            <span className="shrink-0 rounded-full bg-green-500 px-2 py-0.5 text-sm font-medium text-white">
              报名中
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex items-center gap-2 text-gray-600">
              <ClockIcon className="h-5 w-5" />
              <span>活动截止时间：{formattedDeadline}</span>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <ClockIcon className="h-5 w-5" />
              <span className="font-semibold">
                距离结束还有：
                <span className="ml-1" suppressHydrationWarning>
                  {timeLeft}
                </span>
              </span>
            </div>
          </div>
        </Card>

        {/* 数据统计区 */}
        <Card className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex divide-x">
            <div className="flex-1 px-2 text-center">
              <div className="text-xs text-gray-500">报名人数</div>
              <div className="mt-1 text-lg font-bold text-blue-600">
                {registrationCount}
              </div>
            </div>
            <div className="flex-1 px-2 text-center">
              <div className="text-xs text-gray-500">人数上限</div>
              <div className="mt-1 text-lg font-bold">
                {activity.maxRegistrants}
              </div>
            </div>
            <div className="flex-1 px-2 text-center">
              <div className="text-xs text-gray-500">待中签人数</div>
              <div className="mt-1 text-lg font-bold text-green-600">
                {activity.winnersCount}
              </div>
            </div>
          </div>
        </Card>

        {/* 信息展示区 */}
        <Card className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold">活动描述</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="leading-relaxed whitespace-pre-wrap">
              {activity.content}
            </p>
          </div>
        </Card>

        {/* 报名者列表区 */}
        {registrationCount > 0 && (
          <Card className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-bold">已报名</h2>
            <div className="max-h-[300px] overflow-y-auto">
              {registrations.map((registration) => {
                const hasWon = winners.some((w) => w.id === registration.id);
                return (
                  <div
                    key={registration.id}
                    className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
                  >
                    <span className="font-medium">{registration.name}</span>
                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${
                          hasWon
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {hasWon ? "已中签" : "未中签"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(registration.created)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {registrationCount === 0 && (
          <Card className="rounded-lg bg-white p-6 text-center text-gray-600 shadow-md">
            活动暂无报名，无法进行抽签
          </Card>
        )}

        {isPending && (
          <>
            <Card className="rounded-lg bg-yellow-50 p-6 text-center text-yellow-800 shadow-md">
              抽签结果将在 {formattedDeadline} 后公布
            </Card>
            {dayjs().isBefore(dayjs(activity.deadline)) && (
              <div className="mt-6 mb-20 text-center">
                <Link
                  href={`/activity/${activity.id}/register`}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
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
