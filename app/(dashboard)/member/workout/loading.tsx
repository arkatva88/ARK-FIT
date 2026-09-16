export default function MemberWorkoutLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="h-5 w-44 bg-slate-200 rounded" />
        <div className="h-3 w-64 bg-slate-100 rounded" />
      </div>

      {/* Routine Days Grid */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-20 bg-blue-100 rounded" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-10 bg-slate-50 rounded border border-slate-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
