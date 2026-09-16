export default function MemberPaymentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Active Membership Banner Skeleton */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded" />
      </div>

      {/* Payment History List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
        <div className="h-10 bg-slate-50 border-b border-slate-200" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 p-4 flex items-center justify-between">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-5 w-16 bg-emerald-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
