"use client";

import { useForm } from "react-hook-form";
import Form from "next/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  activityFormSchema,
  type ActivityFormData,
} from "~/lib/schemas/activity";

// 配置dayjs使用时区
dayjs.extend(utc);
dayjs.extend(timezone);

// 时区相关
const TIMEZONE = "Asia/Shanghai";
dayjs.tz.setDefault(TIMEZONE);

export type ProcessedActivityData = {
  title: string;
  content: string;
  deadline: string;
  winnersCount: number;
  maxRegistrants: number;
  isPublished: boolean;
  creatorId: string;
};

interface ActivityFormProps {
  id?: string;
  creatorId?: string; // 创建者ID，可选
  onSubmit: (data: FormData) => Promise<void>;
  initialFormData?: Partial<ProcessedActivityData>;
  isSubmitting?: boolean;
  error?: string | null;
}

export function ActivityForm({
  id,
  creatorId,
  onSubmit,
  initialFormData,
  isSubmitting = false,
  error = null,
}: ActivityFormProps) {
  // 设置默认的截止时间为当前时间后24小时，使用本地时区
  // 固定使用特定时区创建默认时间，避免服务端和客户端差异
  const defaultDeadline = dayjs().tz(TIMEZONE).add(24, "hour");

  const {
    register,
    trigger,
    formState: { errors },
    watch,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: initialFormData?.title ?? "",
      content: initialFormData?.content ?? "",
      deadline:
        initialFormData?.deadline ??
        defaultDeadline.format("YYYY-MM-DDTHH:mm:ss"),
      winnersCount: initialFormData?.winnersCount?.toString() ?? "",
      maxRegistrants: initialFormData?.maxRegistrants?.toString() ?? "",
      isPublished: initialFormData?.isPublished ?? true,
      creatorId: initialFormData?.creatorId ?? creatorId,
    },
  });

  const winnersCount = watch("winnersCount");

  // 使用整分钟时间，避免服务端和客户端秒级差异
  const now = dayjs()
    .tz(TIMEZONE)
    .add(1, "minute")
    .startOf("minute")
    .format("YYYY-MM-DDTHH:mm:00");

  // ✅ 手动触发校验的处理函数
  const handleFormAction = async (formData: FormData) => {
    try {
      // 手动触发客户端校验
      const isValid = await trigger();
      if (!isValid) {
        return; // 阻止提交
      }

      // 如果是编辑模式，添加id
      if (id) {
        formData.append("id", id);
      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Form processing error:", error);
    }
  };

  return (
    <Form
      data-testid="activity-form"
      action={handleFormAction}
      className="space-y-4"
    >
      {/* Hidden fields for data that needs to be submitted */}
      <input type="hidden" {...register("creatorId")} />

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
        {errors.title?.message && (
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
            "h-32 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm break-words shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300",
            errors.content && "border-red-500 focus-visible:ring-red-500",
          )}
        />
        {errors.content?.message && (
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
          step="1" // 启用秒级精度
          error={!!errors.deadline}
          {...register("deadline")}
          min={now}
        />
        {errors.deadline?.message && (
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
        {errors.winnersCount?.message && (
          <p
            className="mt-1 text-sm text-red-500"
            data-testid="error-winners-count"
          >
            {errors.winnersCount.message}
          </p>
        )}
        <p className="mt-1 text-sm break-words text-gray-500">
          建议设置合理的中签人数，通常不超过预期报名人数的50%
          {Number(winnersCount) > 500 && (
            <span className="mt-1 block text-yellow-500">
              （当前设置的人数较多，请确认是否合理）
            </span>
          )}
        </p>
      </div>

      <div>
        <label
          htmlFor="maxRegistrants"
          className="mb-2 block text-sm font-medium"
        >
          最大报名人数
        </label>
        <Input
          id="maxRegistrants"
          data-testid="activity-max-registrants"
          type="number"
          min="1"
          max="10000"
          error={!!errors.maxRegistrants}
          {...register("maxRegistrants")}
          placeholder="请输入最大报名人数 (1-10000)"
        />
        {errors.maxRegistrants?.message && (
          <p
            className="mt-1 text-sm text-red-500"
            data-testid="error-max-registrants"
          >
            {errors.maxRegistrants.message}
          </p>
        )}
        <p className="mt-1 text-sm break-words text-gray-500">
          请设置合理的最大报名人数，必须大于等于中签人数
        </p>
      </div>

      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          id="isPublished"
          data-testid="activity-is-published"
          {...register("isPublished")}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label
          htmlFor="isPublished"
          className="text-sm font-medium break-words"
        >
          发布活动（发布后才会显示在报名列表中）
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn("btn btn-primary w-full", isSubmitting && "btn-disabled")}
        aria-label={isSubmitting ? "正在提交表单" : "提交表单"}
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span>提交中...</span>
          </div>
        ) : (
          "提交"
        )}
      </button>
    </Form>
  );
}
