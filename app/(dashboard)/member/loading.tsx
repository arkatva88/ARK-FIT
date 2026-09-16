export default function MemberLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome Card Skeleton */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-64 bg-slate-100 rounded" />
          </div>
          <div className="h-6 w-20 bg-emerald-100 rounded-full" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-6 w-12 bg-slate-300 rounded" />
          </div>
        ))}
      </div>

      {/* Today Workout Routine Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="h-5 w-40 bg-slate-200 rounded" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-50 rounded border border-slate-100 p-3 flex justify-between items-center">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
