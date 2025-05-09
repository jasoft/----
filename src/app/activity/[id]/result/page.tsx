import { notFound } from "next/navigation";
import { type Activity, type Registration } from "~/lib/pb";
import { ResultDisplay } from "./result-display";

interface PocketBaseListResponse<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

async function getActivity(activityId: string): Promise<Activity | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/activities/records/${activityId}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch activity");
  }

  const data = (await res.json()) as Activity;
  return data;
}

async function getRegistrations(activityId: string): Promise<Registration[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/registrations/records?filter=(activity="${activityId}")`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch registrations");
  }

  const data = (await res.json()) as PocketBaseListResponse<Registration>;
  return data.items;
}

async function getWinners(activityId: string): Promise<Registration[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/registrations/records?filter=(activity="${activityId}" && isWinner=true)`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch winners");
  }

  const data = (await res.json()) as PocketBaseListResponse<Registration>;
  return data.items;
}

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const activity = await getActivity(id);

  if (!activity) {
    notFound();
  }

  const now = new Date();
  const deadline = new Date(activity.deadline);
  const isPending = now < deadline;

  const registrations = await getRegistrations(id);
  const winners = isPending ? [] : await getWinners(id);

  return (
    <ResultDisplay
      activity={activity}
      registrations={registrations}
      winners={winners}
      isPending={isPending}
    />
  );
}
