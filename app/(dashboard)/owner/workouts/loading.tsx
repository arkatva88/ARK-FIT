export default function OwnerWorkoutsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <section className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="h-6 w-60 bg-slate-200 rounded" />
        <div className="h-4 w-96 bg-slate-100 rounded" />
      </section>

      {/* Category Pills Skeleton */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-8 w-16 bg-slate-200 rounded flex-shrink-0" />
        ))}
      </div>

      {/* Exercise Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-12 bg-slate-100 rounded" />
            </div>
            <div className="h-3 w-48 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
