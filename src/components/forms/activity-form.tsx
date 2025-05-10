"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// 配置dayjs使用时区
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Shanghai");

// 表单数据类型
interface FormData {
  title: string;
  content: string;
  deadline: string;
  winnersCount: string;
}

// 验证模式
const activitySchema = z.object({
  title: z
    .string()
    .min(1, "活动标题不能为空")
    .max(50, "标题不能超过50个字符")
    .trim(),
  content: z.string().min(1, "活动描述不能为空").trim(),
  deadline: z
    .string()
    .min(1, "截止时间不能为空")
    .refine((val) => {
      const date = dayjs(val).tz();
      const now = dayjs().tz();
      return date.isAfter(now);
    }, "截止时间必须是未来时间"),
  winnersCount: z
    .string()
    .min(1, "中签人数不能为空")
    .refine((val) => !isNaN(Number(val)), "中签人数必须是数字")
    .refine((val) => Number(val) >= 1, "中签人数不能小于1")
    .refine((val) => Number(val) <= 1000, "中签人数不能超过1000人"),
});

interface ActivityFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    deadline: string;
    winnersCount: number;
  }) => Promise<void>;
  defaultValues?: {
    title?: string;
    content?: string;
    deadline?: string;
    winnersCount?: number;
  };
  isSubmitting?: boolean;
  error?: string | null;
}

export function ActivityForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  error = null,
}: ActivityFormProps) {
  // 设置默认的截止时间为当前时间后24小时，使用本地时区
  const defaultDeadline = dayjs().tz().add(24, "hour");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      content: defaultValues?.content ?? "",
      deadline:
        defaultValues?.deadline ?? defaultDeadline.format("YYYY-MM-DDTHH:mm"),
      winnersCount: defaultValues?.winnersCount?.toString() ?? "",
    },
  });

  const winnersCount = watch("winnersCount");

  // 获取当前时间（本地时区）
  const now = dayjs().tz().format("YYYY-MM-DDTHH:mm");

  const handleFormSubmit = handleSubmit(async (data) => {
    // 转换中签人数为数字
    await onSubmit({
      ...data,
      winnersCount: Number(data.winnersCount),
    });
  });

  return (
    <form
      data-testid="activity-form"
      onSubmit={handleFormSubmit}
      className="space-y-4"
      noValidate // 禁用浏览器原生验证
    >
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-500" data-testid="form-error">
            {error}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium">
          活动标题
        </label>
        <Input
          id="title"
          data-testid="activity-title"
          error={!!errors.title}
          {...register("title")}
          placeholder="请输入活动标题"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500" data-testid="error-title">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="content" className="mb-2 block text-sm font-medium">
          活动内容
        </label>
        <textarea
          id="content"
          data-testid="activity-content"
          {...register("content")}
          placeholder="请输入活动内容"
          className={cn(
            "h-32 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300",
            errors.content && "border-red-500 focus-visible:ring-red-500",
          )}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-500" data-testid="error-content">
            {errors.content.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="deadline" className="mb-2 block text-sm font-medium">
          截止时间
        </label>
        <Input
          id="deadline"
          data-testid="activity-deadline"
          type="datetime-local"
          error={!!errors.deadline}
          {...register("deadline")}
          min={now}
        />
        {errors.deadline && (
          <p className="mt-1 text-sm text-red-500" data-testid="error-deadline">
            {errors.deadline.message}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          请选择一个未来的时间，建议留足够的报名时间
        </p>
      </div>

      <div>
        <label
          htmlFor="winnersCount"
          className="mb-2 block text-sm font-medium"
        >
          中签名额
        </label>
        <Input
          id="winnersCount"
          data-testid="activity-winners-count"
          type="number"
          min="1"
          max="1000"
          error={!!errors.winnersCount}
          {...register("winnersCount")}
          placeholder="请输入中签人数 (1-1000)"
        />
        {errors.winnersCount && (
          <p
            className="mt-1 text-sm text-red-500"
            data-testid="error-winners-count"
          >
            {errors.winnersCount.message}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          建议设置合理的中签人数，通常不超过预期报名人数的50%
          {Number(winnersCount) > 500 && (
            <span className="text-yellow-500">
              （当前设置的人数较多，请确认是否合理）
            </span>
          )}
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-full"
      >
        {isSubmitting ? "提交中..." : "提交"}
      </button>
    </form>
  );
}
