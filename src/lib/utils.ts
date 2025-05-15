import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import duration from "dayjs/plugin/duration.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import "dayjs/locale/zh-cn.js";

// 配置dayjs
dayjs.locale("zh-cn");
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(relativeTime);

// 设置默认时区为中国时区
dayjs.tz.setDefault("Asia/Shanghai");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化日期 (确保服务器端和客户端输出一致)
export function formatDate(date: Date | string) {
  return dayjs(date).tz().format("YYYY年MM月DD日 HH:mm");
}

// 获取剩余时间
export function getTimeLeft(deadline: Date | string, now: Date = new Date()) {
  const endTime = dayjs(deadline).tz();
  const currentTime = dayjs(now).tz();
  if (currentTime.isAfter(endTime)) return "已结束";

  const diff = endTime.diff(currentTime);
  const duration = dayjs.duration(diff);

  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();

  if (days > 0) {
    return `还剩 ${days} 天 ${hours} 小时`;
  } else if (hours > 0) {
    return `还剩 ${hours} 小时 ${minutes} 分钟`;
  } else if (minutes > 0) {
    return `还剩 ${minutes} 分钟`;
  } else {
    return "即将结束";
  }
}

// 检查是否已过期
export function isExpired(deadline: Date | string, now: Date = new Date()) {
  const endTime = dayjs(deadline).tz();
  const currentTime = dayjs(now).tz();
  return endTime.isBefore(currentTime);
}

// 随机抽取指定数量的元素
export function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
