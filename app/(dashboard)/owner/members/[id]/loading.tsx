export default function MemberDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-28 bg-slate-200 rounded"></div>

      {/* Header Profile Card skeleton */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-200"></div>
          <div className="space-y-2">
            <div className="h-6 w-40 bg-slate-200 rounded"></div>
            <div className="h-3.5 w-56 bg-slate-100 rounded"></div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="space-y-1.5 text-right">
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
            <div className="h-6 w-12 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Tabs navigation skeleton */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-8 w-24 bg-slate-200 rounded shrink-0"></div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-50 rounded border border-slate-100"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
