import { ActivityForm } from "~/components/forms/activity-form";
import { BackButton } from "~/components/ui/back-button";

interface CreateActivityFormProps {
  error?: string | null;
}

export function CreateActivityForm({ error }: CreateActivityFormProps) {
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">创建活动</h1>
        <BackButton />
      </div>

      <ActivityForm error={error} />
    </>
  );
}
