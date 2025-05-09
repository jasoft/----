"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    // 当组件加载且不处于等待状态时，显示抽签完成提示
    if (!isPending) {
      void Dialog.success(
        "抽签结果已公布",
        `本次活动共有 ${registrations.length} 人报名，${winners.length} 人中签`,
      );
    }
  }, [isPending, registrations.length, winners.length]);

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
            <p className="text-2xl font-bold">{registrations.length}</p>
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
            <p className="text-sm">{formatDate(activity.deadline)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <span className="text-2xl">👥</span>
          <span>报名列表</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {registrations.map((registration) => (
            <Card key={registration.id}>
              <CardHeader>{registration.name}</CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
          抽签结果将在 {formatDate(activity.deadline)} 后公布
        </div>
      ) : (
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
      )}
    </main>
  );
}
