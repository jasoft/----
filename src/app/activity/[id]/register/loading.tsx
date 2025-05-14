export default function Loading() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 h-8 w-1/2 animate-pulse rounded bg-gray-200"></div>
      <div className="mb-8 space-y-4">
        <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200"></div>
        <div className="h-20 animate-pulse rounded bg-gray-200"></div>
        <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200"></div>
      </div>

      <div className="rounded-lg border border-neutral-200 p-6">
        <div className="mb-6 h-6 w-1/4 animate-pulse rounded bg-gray-200"></div>
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded bg-gray-200"></div>
          <div className="h-12 animate-pulse rounded bg-gray-200"></div>
          <div className="h-10 w-full animate-pulse rounded bg-gray-200"></div>
        </div>
      </div>
    </main>
  );
}
