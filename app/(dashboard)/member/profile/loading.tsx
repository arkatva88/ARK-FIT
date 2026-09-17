export default function MemberProfileLoading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <section className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="h-6 w-52 bg-slate-200 rounded" />
        <div className="h-4 w-80 bg-slate-100 rounded" />
      </section>

      {/* Account Info Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-full bg-slate-200" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
        </div>
      </div>

      {/* Trainer Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
        <div className="h-5 w-36 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-50 border border-slate-100 rounded" />
      </div>
    </div>
  );
}
