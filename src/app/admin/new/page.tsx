import type { Metadata } from "next";
import { CreateActivityForm } from "./create-form";

interface PageProps {
  searchParams: {
    error?: string;
  };
}

export const metadata: Metadata = {
  title: "创建活动",
};

export default function CreateActivityPage({ searchParams }: PageProps) {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <CreateActivityForm error={searchParams.error} />
    </div>
  );
}
