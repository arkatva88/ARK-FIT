export default function MemberPtLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <section className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="h-6 w-52 bg-slate-200 rounded" />
        <div className="h-4 w-80 bg-slate-100 rounded" />
      </section>

      {/* Package Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
          <div className="h-6 w-20 bg-amber-100 rounded-full" />
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-full" />
      </div>

      {/* Coach Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
        <div className="h-5 w-40 bg-slate-200 rounded" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200" />
          <div className="space-y-1">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
