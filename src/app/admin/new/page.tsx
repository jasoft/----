import type { Metadata } from "next";
import { CreateActivityForm } from "./create-form";

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
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <CreateActivityForm error={searchParams.error} />
    </div>
  );
}
