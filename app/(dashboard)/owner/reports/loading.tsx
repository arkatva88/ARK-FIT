export default function OwnerReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="h-6 w-64 bg-slate-200 rounded" />
        <div className="h-4 w-96 bg-slate-100 rounded" />
      </div>

      {/* Revenue Breakdown Skeleton */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="h-5 w-44 bg-slate-200 rounded" />
          <div className="h-6 w-24 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded border border-slate-200 bg-slate-50 space-y-2">
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-6 w-20 bg-slate-300 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Member Distribution Skeleton */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="h-5 w-44 bg-slate-200 rounded" />
          <div className="h-6 w-16 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded border border-slate-200 bg-slate-50 space-y-2">
              <div className="h-3 w-32 bg-slate-200 rounded" />
              <div className="h-6 w-12 bg-slate-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
