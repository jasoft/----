import type { Metadata } from "next";
import { CreateActivityForm } from "./create-form";
import { getCachedCurrentUser } from "~/services/auth-cache";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export const metadata: Metadata = {
  title: "创建活动",
};

export default async function CreateActivityPage(props: PageProps) {
  const searchParams = await props.searchParams;

  // 测量getCachedCurrentUser运行时间
  const requestId = Math.random().toString(36).substring(7);
  const timestamp = new Date().toISOString();
  const startTime = performance.now();
  const user = await getCachedCurrentUser();
  const endTime = performance.now();
  console.log(
    JSON.stringify({
      event: "getCachedCurrentUser_performance",
      requestId,
      timestamp,
      duration: endTime - startTime,
      url: "/admin/new",
    }),
  );

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto max-w-screen-sm px-4 py-8">
      <CreateActivityForm error={searchParams.error} creatorId={user.id} />
    </div>
  );
}
