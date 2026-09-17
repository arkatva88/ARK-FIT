export default function TrainerNotesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-slate-200 rounded" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-slate-200 rounded" />
          <div className="h-8 w-16 bg-slate-100 rounded" />
        </div>
      </section>

      {/* Notes List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-28 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded" />
            </div>
            <div className="h-10 bg-slate-50 border border-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
