"use client";

import { useEffect, useState } from "react";
import { getTimeLeft } from "~/lib/utils";

interface ActivityCountdownProps {
  deadline: string;
  className?: string;
}

export function ActivityCountdown({
  deadline,
  className,
}: ActivityCountdownProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 每分钟更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 每分钟更新
    return () => clearInterval(timer);
  }, []);

  return (
    <span className={className}>{getTimeLeft(deadline, currentTime)}</span>
  );
}
