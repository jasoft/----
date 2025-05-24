import type { Metadata } from "next";
import { CreateActivityForm } from "./create-form";
import { currentUser } from "@clerk/nextjs/server";
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
  const user = await currentUser();
  console.log("CreateActivityPage user:", user);
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto max-w-screen-sm px-4 py-8">
      <CreateActivityForm error={searchParams.error} creatorId={user.id} />
    </div>
  );
}
