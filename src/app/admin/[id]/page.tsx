import { EditActivityForm } from "./edit-form";
import { activityService } from "~/services/activity";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    error?: string;
  };
}

export default async function EditActivityPage({ params }: PageProps) {
  try {
    const { id } = await params;
    const activity = await activityService.getActivity(id);

    return (
      <div className="container mx-auto max-w-4xl py-8">
        <EditActivityForm activity={activity} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching activity:", error);
    notFound();
  }
}
