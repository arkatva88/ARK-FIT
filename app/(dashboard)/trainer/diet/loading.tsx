export default function TrainerDietLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200">
        <div className="space-y-2">
          <div className="h-6 w-60 bg-slate-200 rounded" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
        </div>
        <div className="h-7 w-28 bg-emerald-50 rounded-full" />
      </section>

      {/* Diet Plans Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
              <div className="h-5 w-16 bg-emerald-100 rounded" />
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded">
              <div className="space-y-1">
                <div className="h-2.5 w-12 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-300 rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-12 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-300 rounded" />
              </div>
            </div>

            <div className="h-8 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
