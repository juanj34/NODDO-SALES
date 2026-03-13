"use client";

function ShimmerBlock({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden bg-[var(--surface-2)] rounded-xl ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
          animation: "shimmer 1.8s infinite",
        }}
      />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <ShimmerBlock className="h-8 w-64" />
        <ShimmerBlock className="h-4 w-44 rounded-lg" />
      </div>

      {/* KPI strip skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <ShimmerBlock key={i} className="h-[100px]" />
        ))}
      </div>

      {/* Shortcuts skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <ShimmerBlock key={i} className="h-[72px]" />
        ))}
      </div>

      {/* Analytics section skeleton */}
      <ShimmerBlock className="h-[360px]" />

      {/* Project grid skeleton */}
      <div className="space-y-4">
        <ShimmerBlock className="h-3 w-28 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <ShimmerBlock key={i} className="h-[340px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function KPIStripSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <ShimmerBlock key={i} className="h-[100px]" />
      ))}
    </div>
  );
}
