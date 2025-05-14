"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="mb-4 text-center text-red-600">
          {error.message || "加载活动列表失败"}
        </p>
        <div className="flex justify-center">
          <button onClick={reset} className="btn btn-primary btn-sm">
            重试
          </button>
        </div>
      </div>
    </div>
  );
}
