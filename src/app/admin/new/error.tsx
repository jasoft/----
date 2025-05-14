"use client";

import { BackButton } from "~/components/ui/back-button";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="rounded-lg border border-red-200 bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold text-red-900">创建活动失败</h1>
        <p className="mb-4 text-red-600">
          {error.message || "创建活动时出现错误"}
        </p>
        <div className="flex gap-4">
          <BackButton />
          <button onClick={reset} className="btn btn-primary">
            重试
          </button>
        </div>
      </div>
    </div>
  );
}
