"use client";

import { cn } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { createActivity, updateActivity } from "~/app/actions/activity";
import { useRouter } from "next/navigation";
import type { ActivityFormData } from "~/app/actions/activity";
import { SubmitButton } from "~/components/ui/submit-button";
// 配置dayjs使用时区
dayjs.extend(utc);
dayjs.extend(timezone);

// 时区相关
const TIMEZONE = "Asia/Shanghai";
dayjs.tz.setDefault(TIMEZONE);

interface ActivityFormProps {
  id?: string;
  defaultValues?: Partial<ActivityFormData>;
  error?: string | null;
}

export function ActivityForm({
  id,
  defaultValues,
  error = null,
}: ActivityFormProps) {
  // 设置默认的截止时间为当前时间后24小时，使用本地时区
  const defaultDeadline = dayjs().tz(TIMEZONE).add(24, "hour");

  // 获取当前时间（固定时区）
  const now = dayjs().tz(TIMEZONE).format("YYYY-MM-DDTHH:mm");

  // 根据是否有id选择创建或更新action
  const router = useRouter();

  // 处理表单提交
  const handleSubmit = async (formData: FormData) => {
    try {
      // 处理日期时间
      const deadline = formData.get("deadline");
      if (deadline) {
        // 将本地时间转换为 UTC+8
        const localDate = dayjs(deadline as string).tz(TIMEZONE);
        formData.set("deadline", localDate.format());
      }

      // 调用相应的 action
      if (id) {
        await updateActivity(id, formData);
      } else {
        await createActivity(formData);
      }

      // 在客户端手动执行路由跳转
      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("表单提交错误:", error);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
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
          name="title"
          data-testid="activity-title"
          defaultValue={defaultValues?.title}
          placeholder="请输入活动标题"
        />
      </div>

      <div>
        <label htmlFor="content" className="mb-2 block text-sm font-medium">
          活动内容
        </label>
        <textarea
          id="content"
          name="content"
          data-testid="activity-content"
          defaultValue={defaultValues?.content}
          placeholder="请输入活动内容"
          className={cn(
            "h-32 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300",
          )}
        />
      </div>

      <div>
        <label htmlFor="deadline" className="mb-2 block text-sm font-medium">
          截止时间
        </label>
        <Input
          id="deadline"
          name="deadline"
          data-testid="activity-deadline"
          type="datetime-local"
          min={now}
          defaultValue={(defaultValues?.deadline
            ? dayjs(defaultValues.deadline).tz(TIMEZONE)
            : defaultDeadline
          ).format("YYYY-MM-DDTHH:mm:00")}
        />
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
          name="winnersCount"
          data-testid="activity-winners-count"
          type="number"
          min="1"
          max="1000"
          defaultValue={defaultValues?.winnersCount}
          placeholder="请输入中签人数 (1-1000)"
        />
        <p className="mt-1 text-sm text-gray-500">
          建议设置合理的中签人数，通常不超过预期报名人数的50%
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
          name="maxRegistrants"
          data-testid="activity-max-registrants"
          type="number"
          min="1"
          max="10000"
          defaultValue={defaultValues?.maxRegistrants}
          placeholder="请输入最大报名人数 (1-10000)"
        />
        <p className="mt-1 text-sm text-gray-500">
          请设置合理的最大报名人数，必须大于等于中签人数
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublished"
          name="isPublished"
          defaultChecked={defaultValues?.isPublished}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isPublished" className="text-sm font-medium">
          发布活动（发布后才会显示在报名列表中）
        </label>
      </div>

      <SubmitButton className="btn btn-primary w-full">提交</SubmitButton>
    </form>
  );
}
