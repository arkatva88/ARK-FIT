export default function OwnerTrainersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Greeting Skeleton */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-slate-200 rounded" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
        </div>
        <div className="h-7 w-32 bg-blue-50 rounded-full" />
      </section>

      {/* Trainers Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-5 w-14 bg-slate-100 rounded-full" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-2 rounded space-y-1">
                <div className="h-2.5 w-16 bg-slate-200 rounded" />
                <div className="h-4 w-8 bg-slate-300 rounded" />
              </div>
              <div className="bg-slate-50 p-2 rounded space-y-1">
                <div className="h-2.5 w-16 bg-slate-200 rounded" />
                <div className="h-4 w-8 bg-slate-300 rounded" />
              </div>
            </div>

            <div className="h-9 bg-slate-100 rounded border border-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
