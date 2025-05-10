"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Activity, Registration } from "~/lib/pb";
import { formatDate } from "~/lib/utils";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Dialog } from "~/components/ui/dialog";

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
  // 用于控制客户端渲染的内容
  const [mounted, setMounted] = useState(false);

  // 预先计算不会改变的内容
  const formattedDeadline = formatDate(activity.deadline);
  const registrationCount = registrations.length;
  const winnerCount = winners.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isPending && registrationCount > 0) {
      const timer = setTimeout(() => {
        try {
          void Dialog.success(
            "抽签结果已公布",
            `本次活动共有 ${registrationCount} 人报名，${winnerCount} 人中签`,
          );
        } catch (error) {
          console.warn("Failed to show dialog:", error);
        }
      }, 500); // 延迟显示对话框，避免hydration问题

      return () => clearTimeout(timer);
    }
  }, [mounted, isPending, registrationCount, winnerCount]);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{activity.title}</h1>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <span className="text-xl">👥</span>
            <span>报名人数</span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{registrationCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <span className="text-xl">🎯</span>
            <span>中签名额</span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activity.winnersCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <span className="text-xl">⏰</span>
            <span>截止时间</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formattedDeadline}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <span className="text-2xl">👥</span>
          <span>报名列表</span>
        </h2>
        {registrationCount > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {registrations.map((registration) => (
              <Card key={registration.id}>
                <CardHeader>{registration.name}</CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-neutral-50 p-4 text-neutral-600">
            暂无报名信息
          </div>
        )}
      </div>

      {/* 仅在组件挂载后显示可能变化的内容 */}
      {mounted && (
        <>
          {isPending ? (
            <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
              抽签结果将在 {formattedDeadline} 后公布
            </div>
          ) : registrationCount > 0 ? (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                <span className="text-2xl">🎯</span>
                <span>中签名单</span>
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {winners.map((winner) => (
                  <Card key={winner.id}>
                    <CardHeader>{winner.name}</CardHeader>
                    <CardContent>
                      <Image
                        src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/registrations/${winner.id}/${winner.photo}`}
                        alt={winner.name}
                        width={300}
                        height={300}
                        className="aspect-square w-full rounded-md object-cover"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-neutral-50 p-4 text-neutral-600">
              活动暂无报名，无法进行抽签
            </div>
          )}
        </>
      )}
    </main>
  );
}
