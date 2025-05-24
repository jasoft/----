"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createActivity } from "~/app/actions/activity";
import { ActivityForm } from "~/components/forms/activity-form";
import { BackButton } from "~/components/ui/back-button";

interface CreateActivityFormProps {
  error?: string | null;
  creatorId: string;
}

export function CreateActivityForm({
  error: initialError,
  creatorId,
}: CreateActivityFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(
    initialError ?? null,
  );
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setFormError(null);
    try {
      startTransition(async () => {
        try {
          await createActivity(formData);
          router.push("/admin");
        } catch (err) {
          console.error("Failed to create activity:", err);
          setFormError(
            err instanceof Error ? err.message : "创建活动失败，请重试",
          );
        }
      });
    } catch (err) {
      console.error("Submission error:", err);
      setFormError("表单提交失败，请重试");
    }
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">创建活动</h1>
        <BackButton />
      </div>

      <ActivityForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        error={formError}
        creatorId={creatorId}
      />
    </>
  );
}
