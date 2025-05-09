import type { Metadata } from "next";
import { ActivityContainer } from "../activity-container";

export const metadata: Metadata = {
  title: "创建活动",
};

export default function NewActivityPage() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">创建活动</h1>
      <ActivityContainer mode="create" />
    </main>
  );
}
