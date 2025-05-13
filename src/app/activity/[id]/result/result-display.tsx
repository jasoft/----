"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Activity, Registration } from "~/lib/pb";
import { formatDate } from "~/lib/utils";
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
  const [mounted, setMounted] = useState(false);
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
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [mounted, isPending, registrationCount, winnerCount]);

  return (
    <main className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{activity.title}</h1>
        <Link href="/" className="btn btn-outline">
          返回首页
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-lg bg-neutral-50 p-6">
        <div className="text-center">
          <div className="mb-2 text-2xl">👥</div>
          <div className="text-sm text-neutral-600">报名人数</div>
          <div className="mt-1 text-2xl font-bold">{registrationCount}</div>
        </div>
        <div className="text-center">
          <div className="mb-2 text-2xl">🎯</div>
          <div className="text-sm text-neutral-600">中签名额</div>
          <div className="mt-1 text-2xl font-bold">{activity.winnersCount}</div>
        </div>
        <div className="text-center">
          <div className="mb-2 text-2xl">⏰</div>
          <div className="text-sm text-neutral-600">截止时间</div>
          <div className="mt-1 text-sm">{formattedDeadline}</div>
        </div>
      </div>

      {mounted && (
        <div className="space-y-6">
          {isPending ? (
            <div className="rounded-lg bg-yellow-50 p-6 text-center text-yellow-800">
              抽签结果将在 {formattedDeadline} 后公布
            </div>
          ) : registrationCount > 0 ? (
            <>
              <div>
                <h2 className="mb-4 text-xl font-bold">所有报名者</h2>
                <div className="rounded-lg border p-4">
                  <div className="flex flex-wrap gap-2">
                    {registrations.map((registration) => (
                      <span
                        key={registration.id}
                        className={`badge badge-lg ${
                          winners.some((w) => w.id === registration.id)
                            ? "badge-primary"
                            : "badge-ghost"
                        }`}
                        title={registration.phone}
                      >
                        {registration.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-xl font-bold">抽签结果</h2>
                <div className="border-primary bg-primary/5 rounded-lg border p-6">
                  <div className="mb-4 text-center text-sm text-neutral-600">
                    共 {registrationCount} 人报名，{winnerCount} 人中签 （中签率{" "}
                    {Math.round((winnerCount / registrationCount) * 100)}%）
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {winners.map((winner, index) => (
                      <div
                        key={winner.id}
                        className="rounded-lg bg-white p-4 text-center shadow-sm"
                        data-testid="winner-row"
                      >
                        <div className="mb-2 text-2xl">🎉</div>
                        <div className="text-lg font-medium">{winner.name}</div>
                        <div className="mt-1 text-sm text-neutral-500">
                          中签序号 {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg bg-neutral-50 p-6 text-center text-neutral-600">
              活动暂无报名，无法进行抽签
            </div>
          )}
        </div>
      )}
    </main>
  );
}
