export default function LeadsLoading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-32 bg-[var(--surface-2)] rounded-lg" />
          <div className="h-4 w-48 bg-[var(--surface-2)] rounded mt-2" />
        </div>
        <div className="h-10 w-32 bg-[var(--surface-2)] rounded-lg" />
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="h-10 flex-1 max-w-sm bg-[var(--surface-2)] rounded-lg" />
        <div className="h-10 w-40 bg-[var(--surface-2)] rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="flex gap-4 px-6 py-3 border-b border-[var(--border-subtle)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-20 bg-[var(--surface-3)] rounded" />
          ))}
        </div>
        {/* Body rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 px-6 py-4 border-b border-[var(--border-subtle)] last:border-0"
          >
            <div className="h-4 w-28 bg-[var(--surface-3)] rounded" />
            <div className="h-4 w-36 bg-[var(--surface-3)] rounded" />
            <div className="h-4 w-24 bg-[var(--surface-3)] rounded" />
            <div className="h-4 w-16 bg-[var(--surface-3)] rounded" />
            <div className="h-4 w-20 bg-[var(--surface-3)] rounded" />
            <div className="h-4 w-20 bg-[var(--surface-3)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
