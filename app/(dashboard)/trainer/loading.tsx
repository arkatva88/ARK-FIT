export default function TrainerLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="h-3 w-72 bg-slate-100 rounded" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-6 w-12 bg-slate-300 rounded" />
          </div>
        ))}
      </div>

      {/* Today Sessions List Skeleton */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-50 rounded-lg border border-slate-100 p-3 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-28 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
