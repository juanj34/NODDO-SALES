export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-xl bg-[var(--surface-2)] animate-pulse" />
        <div className="h-4 w-44 rounded-lg bg-[var(--surface-2)] animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[100px] rounded-xl bg-[var(--surface-2)] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[72px] rounded-xl bg-[var(--surface-2)] animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-3 w-28 rounded-lg bg-[var(--surface-2)] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[340px] rounded-xl bg-[var(--surface-2)] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
