export default function TrainerMemberProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-32 bg-slate-200 rounded" />

      {/* Member Profile Header */}
      <section className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-5 w-44 bg-slate-200 rounded" />
              <div className="h-3 w-28 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <div className="h-9 w-36 bg-slate-200 rounded" />
        <div className="h-9 w-36 bg-slate-200 rounded" />
      </div>

      {/* Workout & Diet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="h-5 w-36 bg-slate-200 rounded" />
          <div className="h-20 bg-slate-50 border border-slate-100 rounded" />
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="h-5 w-36 bg-slate-200 rounded" />
          <div className="h-20 bg-slate-50 border border-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}
