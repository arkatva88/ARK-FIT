export default function TrainerProgressLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-52 bg-slate-200 rounded"></div>
          <div className="h-3.5 w-72 bg-slate-100 rounded"></div>
        </div>
        <div className="h-8 w-32 bg-slate-200 rounded shrink-0"></div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-4">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-slate-50 rounded border border-slate-100"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
