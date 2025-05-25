"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "~/components/ui/back-button";
import { DeleteButton } from "./delete-button";
import { ActivityForm } from "~/components/forms/activity-form";
import { notFound } from "next/navigation";
import { updateActivity } from "~/app/actions/activity";
import type { Activity } from "~/lib/pb";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// 配置dayjs使用时区
dayjs.extend(utc);
dayjs.extend(timezone);

// 时区相关
const TIMEZONE = "Asia/Shanghai";
dayjs.tz.setDefault(TIMEZONE);

interface EditActivityFormProps {
  activity: Activity;
  error?: string | null;
}

export function EditActivityForm({ activity, error }: EditActivityFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!activity) {
    notFound();
  }

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        // 调用服务端action
        console.log(
          "Submitting form data:",
          Object.fromEntries(formData.entries()),
        );
        await updateActivity(activity.id, formData);
        router.push("/admin");
      } catch (error) {
        console.error("Failed to update activity:", error);
        throw error;
      }
    });
  };

  // 将deadline转换为本地时间字符串
  const localDeadline = dayjs(activity.deadline)
    .tz(TIMEZONE)
    .format("YYYY-MM-DDTHH:mm:ss");

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">编辑活动</h1>
        <div className="flex gap-4">
          <BackButton />
          <DeleteButton id={activity.id} />
        </div>
      </div>

      <ActivityForm
        id={activity.id}
        creatorId={activity.creatorId}
        error={error}
        defaultValues={{
          title: activity.title,
          content: activity.content,
          deadline: localDeadline,
          winnersCount: activity.winnersCount,
          maxRegistrants: activity.maxRegistrants,
          isPublished: activity.isPublished,
          creatorId: activity.creatorId,
        }}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
    </>
  );
}
