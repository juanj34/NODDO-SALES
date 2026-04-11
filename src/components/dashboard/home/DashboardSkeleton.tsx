"use client";

function Bone({ className }: { className: string }) {
  return <div className={`bg-[var(--surface-2)] rounded-xl animate-pulse ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <div className="space-y-2">
        <Bone className="h-8 w-64" />
        <Bone className="h-4 w-44 rounded-lg" />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-[100px]" />
        ))}
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-[72px]" />
        ))}
      </div>

      {/* Projects section */}
      <div className="space-y-4">
        <Bone className="h-3 w-28 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-[340px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function KPIStripSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <Bone key={i} className="h-[100px]" />
      ))}
    </div>
  );
}
