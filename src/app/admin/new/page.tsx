import { ActivityContainer } from "../activity-container";

export default function NewActivityPage() {
  return (
    <main className="container mx-auto min-h-screen px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">新建活动</h1>
      <ActivityContainer mode="create" />
    </main>
  );
}
