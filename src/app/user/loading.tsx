export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">活动列表</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse shadow-xl">
            <div className="card-body">
              <div className="h-6 w-3/4 rounded bg-gray-200"></div>
              <div className="mt-4 space-y-1">
                <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                <div className="h-4 w-1/3 rounded bg-gray-200"></div>
              </div>
              <div className="mt-4 h-16 rounded bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
