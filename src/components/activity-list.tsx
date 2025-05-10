"use client";

import { useEffect, useState } from "react";
import type { Activity } from "~/lib/pb";
import { ActivityCard } from "./activity-card";

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  // 用于强制更新倒计时的状态
  const [, setTick] = useState(0);

  // 每分钟更新一次倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      data-testid="activity-list"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
