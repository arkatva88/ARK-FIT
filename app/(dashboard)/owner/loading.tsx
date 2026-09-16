export default function OwnerLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-20 bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-center space-y-2">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="h-3 w-80 bg-slate-100 rounded" />
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white p-5 rounded-lg border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded bg-slate-100" />
            </div>
            <div className="h-6 w-24 bg-slate-300 rounded" />
          </div>
        ))}
      </div>

      {/* Main Floor Status + Today Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-slate-50 rounded border border-slate-100" />
            ))}
          </div>
        </div>

        <div className="h-72 bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded border border-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
