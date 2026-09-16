export default function OwnerAttendanceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-slate-200 rounded" />
          <div className="h-9 w-24 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Stats Ribbon Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-white p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-5 w-12 bg-slate-300 rounded" />
          </div>
        ))}
      </div>

      {/* Attendance Table Skeleton */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="h-10 bg-slate-50 border-b border-slate-200" />
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
              <div className="h-7 w-24 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
