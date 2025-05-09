import { notFound } from "next/navigation";
import { type Activity } from "~/lib/pb";
import { RegistrationForm } from "~/components/forms/registration-form";
import { formatDate, isExpired } from "~/lib/utils";

async function getActivity(id: string | undefined): Promise<Activity | null> {
  if (!id) {
    return null;
  }
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/activities/records/${id}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch activity");
  }

  const data = (await res.json()) as Activity;
  return data;
}

interface Props {
  params: {
    id: string;
  };
}

interface ValidationError {
  code: string;
  message: string;
}

interface PocketBaseErrorResponse {
  code: number;
  message: string;
  data: {
    name?: ValidationError;
    phone?: ValidationError;
  };
}

export default async function RegisterPage({ params }: Props) {
  // 确保在访问params.id前先await params
  const resolvedParams = await Promise.resolve(params);
  const activity = await getActivity(resolvedParams.id).catch(() => null);

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

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/registrations/records`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({
        code: res.status,
        message: res.statusText,
        data: {},
      }))) as PocketBaseErrorResponse;

      if (errorData.data?.phone?.message) {
        throw new Error(`手机号码无效: ${errorData.data.phone.message}`);
      }
      if (errorData.data?.name?.message) {
        throw new Error(`姓名无效: ${errorData.data.name.message}`);
      }
      throw new Error(errorData.message || "提交报名失败");
    }

    // 确保响应体是合法的JSON
    await res.json();
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
