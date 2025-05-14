import { BackButton } from "~/components/ui/back-button";
import { DeleteButton } from "./delete-button";
import { ActivityForm } from "~/components/forms/activity-form";
import { notFound } from "next/navigation";
import type { Activity } from "~/lib/pb";

interface EditActivityFormProps {
  activity: Activity;
  error?: string | null;
}

export async function EditActivityForm({
  activity,
  error,
}: EditActivityFormProps) {
  if (!activity) {
    notFound();
  }

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
        error={error}
        defaultValues={{
          title: activity.title,
          content: activity.content,
          deadline: new Date(activity.deadline).toISOString().slice(0, 16),
          winnersCount: activity.winnersCount,
          maxRegistrants: activity.maxRegistrants,
          isPublished: activity.isPublished,
        }}
      />
    </>
  );
}
