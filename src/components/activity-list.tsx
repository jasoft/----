import type { Activity } from "~/lib/pb";
import { ActivityCard } from "./activity-card";
import { Suspense } from "react";

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <div
      data-testid="activity-list"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {activities.map((activity) => (
        <Suspense key={activity.id} fallback={<ActivityCardSkeleton />}>
          <ActivityCard activity={activity} />
        </Suspense>
      ))}
    </div>
  );
}

function ActivityCardSkeleton() {
  return (
    <div className="card animate-pulse shadow-xl">
      <div className="card-body">
        <div className="h-6 w-3/4 rounded bg-gray-200"></div>
        <div className="mt-4 space-y-1">
          <div className="h-4 w-1/2 rounded bg-gray-200"></div>
          <div className="h-4 w-1/3 rounded bg-gray-200"></div>
        </div>
        <div className="mt-4 h-16 rounded bg-gray-200"></div>
        <div className="mt-4 flex justify-between">
          <div className="h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="h-8 w-1/4 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}
