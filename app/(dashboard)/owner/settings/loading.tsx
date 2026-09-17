export default function OwnerSettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
        <div className="h-6 w-64 bg-slate-200 rounded" />
        <div className="h-4 w-96 bg-slate-100 rounded" />
      </div>

      {/* Gym Identity Card */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-4">
        <div className="h-5 w-36 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-9 w-full bg-slate-50 border border-slate-200 rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="h-9 w-full bg-slate-50 border border-slate-200 rounded" />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="h-9 w-full bg-slate-50 border border-slate-200 rounded" />
          </div>
        </div>
      </div>

      {/* Gateway & Messaging Cards */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-3">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="h-14 bg-slate-50 border border-slate-200 rounded" />
      </div>
    </div>
  );
}
