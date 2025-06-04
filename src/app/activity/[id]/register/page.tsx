import { notFound, redirect } from "next/navigation";
import type { Activity } from "~/lib/pb";
import type { Metadata } from "next";
import { activityService } from "~/services/activity";
import { RegistrationForm } from "~/components/forms/registration-form";
import { formatDate, isExpired } from "~/lib/utils";

interface Props {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
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

async function getActivity(id: string): Promise<Activity> {
  const activity = await activityService.getActivity(id);

  if (!activity) {
    notFound();
  }

  return activity;
}

export default async function RegisterPage(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const activity = await getActivity(params.id);

  // 检查是否已截止
  if (isExpired(activity.deadline)) {
    // 直接重定向到结果页面
    redirect(`/activity/${activity.id}/result`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto flex-1 space-y-6 px-4 py-6">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-6 text-2xl font-bold md:text-3xl">
            {activity.title}
          </h1>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                报名截止时间: {formatDate(activity.deadline)}
              </p>
              <p className="text-sm text-gray-600">
                中签名额: {activity.winnersCount}人
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-semibold">活动描述</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="leading-relaxed whitespace-pre-wrap">
              {activity.content}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-semibold">报名表单</h2>
          <RegistrationForm
            activityId={activity.id}
            error={searchParams.error}
          />
        </div>
      </div>
    </div>
  );
}
