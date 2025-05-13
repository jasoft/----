import { notFound } from "next/navigation";
import { type Activity } from "~/lib/pb";
import { activityService } from "~/services/activity";
import { RegistrationForm } from "~/components/forms/registration-form";
import { formatDate, isExpired } from "~/lib/utils";

async function getActivity(id: string | undefined): Promise<Activity | null> {
  if (!id) {
    return null;
  }
  try {
    return await activityService.getActivity(id);
  } catch (error) {
    console.error("Error fetching activity:", error);
    return null;
  }
}

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function RegisterPage({ params }: Props) {
  const { id } = await params;
  const activity = await getActivity(id);

  if (!activity) {
    notFound();
  }

  if (isExpired(activity.deadline)) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">{activity.title}</h1>
        <div className="rounded-lg bg-red-50 p-4 text-red-800">报名已截止</div>
      </main>
    );
  }

  async function handleRegistration(formData: FormData) {
    "use server";

    try {
      await activityService.createRegistration(formData);
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        const errorMsg = error.message;
        if (errorMsg.includes("phone")) {
          throw new Error(
            "手机号码错误。请检查: 1. 是否是11位数字 2. 是否以1开头 3. 第二位是否在3-9之间",
          );
        }
        if (errorMsg.includes("name")) {
          throw new Error("姓名错误。姓名长度需要在2-20个字符之间");
        }
        if (errorMsg.includes("Failed to create record")) {
          throw new Error(
            "创建报名记录失败。可能原因: 1. 该手机号已报名 2. 活动已截止 3. 报名人数已满",
          );
        }
        throw new Error(errorMsg || "提交报名失败。如果问题持续，请联系管理员");
      }
      throw error;
    }
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
        <RegistrationForm
          activityId={activity.id}
          onSubmit={handleRegistration}
        />
      </div>
    </main>
  );
}
