export default function TrainerPtSessionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="h-3 w-72 bg-slate-100 rounded" />
      </div>

      {/* Calendar Rows */}
      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-20 bg-blue-100 rounded" />
              </div>
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
            <div className="h-8 w-28 bg-slate-200 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
