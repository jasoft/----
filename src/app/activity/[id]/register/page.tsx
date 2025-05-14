import { notFound } from "next/navigation";
import type { Activity } from "~/lib/pb";
import type { Metadata } from "next";
import { activityService } from "~/services/activity";
import { RegistrationForm } from "~/components/forms/registration-form";
import { formatDate, isExpired } from "~/lib/utils";

interface Props {
  params: {
    id: string;
  };
  searchParams: {
    error?: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const activity = await activityService.getActivity(params.id);

  if (!activity) {
    return {
      title: "活动不存在",
    };
  }

  return {
    title: `报名 - ${activity.title}`,
    description: `报名参加${activity.title}，截止时间：${formatDate(activity.deadline)}`,
  };
}

function ExpiredState({ title }: { title: string }) {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{title}</h1>
      <div className="rounded-lg bg-red-50 p-4 text-red-800">报名已截止</div>
    </main>
  );
}

async function getActivity(id: string): Promise<Activity> {
  const activity = await activityService.getActivity(id);

  if (!activity) {
    notFound();
  }

  return activity;
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const activity = await getActivity(params.id);

  // 检查是否已截止
  if (isExpired(activity.deadline)) {
    return <ExpiredState title={activity.title} />;
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{activity.title}</h1>
      <div className="mb-8 space-y-4">
        <p className="text-sm text-neutral-500">
          报名截止时间: {formatDate(activity.deadline)}
        </p>
        <div className="prose dark:prose-invert max-w-none">
          {activity.content}
        </div>
        <p className="text-sm text-neutral-500">
          中签名额: {activity.winnersCount}人
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 p-6">
        <h2 className="mb-6 text-xl font-semibold">报名表单</h2>
        <RegistrationForm activityId={activity.id} error={searchParams.error} />
      </div>
    </main>
  );
}
