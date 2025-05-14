import { BackButton } from "~/components/ui/back-button";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">找不到活动</h1>
        <p className="mb-4 text-gray-600">
          您要查看的活动可能已被删除或者不存在。
        </p>
        <BackButton />
      </div>
    </div>
  );
}
