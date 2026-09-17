export default function MemberDietLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <section className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="h-6 w-52 bg-slate-200 rounded" />
        <div className="h-4 w-80 bg-slate-100 rounded" />
      </section>

      {/* Macro Targets */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-lg border border-slate-200 bg-white space-y-2">
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-300 rounded" />
          </div>
        ))}
      </section>

      {/* Meals List */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-48 bg-slate-100 rounded" />
              <div className="h-3 w-40 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
