export default function OwnerPtLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded" />
      </div>

      {/* PT Packages Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
              <div className="h-5 w-16 bg-amber-100 rounded" />
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-full" />
            <div className="h-8 bg-slate-50 rounded border border-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
