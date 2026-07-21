export default function DoctorLoading() {
  return (
    <div className="p-6 md:p-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8 h-8 w-56 rounded-xl bg-slate-200" />

      {/* Stat cards skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-9 w-9 rounded-xl bg-slate-100" />
            </div>
            <div className="h-9 w-24 rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100" />
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
