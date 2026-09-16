export default function MemberProgressLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
          <div className="h-3.5 w-64 bg-slate-100 rounded"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-2">
            <div className="h-3 w-24 bg-slate-200 rounded"></div>
            <div className="h-7 w-20 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-4">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-50 rounded border border-slate-100"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
