export default function MemberAttendanceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <section className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="h-6 w-52 bg-slate-200 rounded" />
        <div className="h-4 w-80 bg-slate-100 rounded" />
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-lg border border-slate-200 bg-white space-y-2">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-300 rounded" />
          </div>
        ))}
      </section>

      {/* Recent Check-in Logs Skeleton */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
        <div className="h-4 w-36 bg-slate-200 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="p-3 rounded border border-slate-200 bg-slate-50 space-y-2">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-4 w-14 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
