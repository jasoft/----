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
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="mb-4 text-xl font-semibold text-red-800">报名失败</h2>
      <p className="mb-6 text-red-600">
        {error.message || "加载活动或报名时出现错误"}
      </p>
      <div className="flex gap-4">
        <BackButton />
        <button onClick={reset} className="btn btn-primary">
          重试
        </button>
      </div>
    </div>
  );
}
