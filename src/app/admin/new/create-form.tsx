"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createActivity } from "~/app/actions/activity";
import { ActivityForm } from "~/components/forms/activity-form";
import { BackButton } from "~/components/ui/back-button";

interface CreateActivityFormProps {
  error?: string | null;
  creatorId: string;
}

export function CreateActivityForm({
  error,
  creatorId,
}: CreateActivityFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await createActivity(formData);
        router.push("/admin");
      } catch (error) {
        console.error("Failed to create activity:", error);
        throw error;
      }
    });
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
        error={error}
        creatorId={creatorId}
      />
    </>
  );
}
