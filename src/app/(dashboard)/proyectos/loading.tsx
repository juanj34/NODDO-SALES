export default function ProyectosLoading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-48 bg-[var(--surface-2)] rounded-lg" />
          <div className="h-4 w-32 bg-[var(--surface-2)] rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-[var(--surface-2)] rounded-xl" />
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="h-10 flex-1 max-w-sm bg-[var(--surface-2)] rounded-lg" />
        <div className="h-10 w-32 bg-[var(--surface-2)] rounded-lg" />
        <div className="h-10 w-10 bg-[var(--surface-2)] rounded-lg" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden"
          >
            <div className="aspect-[16/9] bg-[var(--surface-2)]" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 bg-[var(--surface-2)] rounded" />
              <div className="h-3 w-1/2 bg-[var(--surface-2)] rounded" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 bg-[var(--surface-2)] rounded-full" />
                <div className="h-6 w-20 bg-[var(--surface-2)] rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
