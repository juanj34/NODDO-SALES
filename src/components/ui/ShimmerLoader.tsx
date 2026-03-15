"use client";

/**
 * Componente de shimmer loading consistente para toda la plataforma
 * Reemplaza los animate-pulse inconsistentes
 */

interface ShimmerProps {
  className?: string;
  variant?: "card" | "text" | "circle" | "stat";
}

export function Shimmer({ className = "", variant = "card" }: ShimmerProps) {
  const baseClasses = "relative overflow-hidden bg-[var(--surface-2)]";

  const variantClasses = {
    card: "rounded-xl h-32",
    text: "rounded h-4",
    circle: "rounded-full",
    stat: "rounded-xl h-24",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="shimmer-gradient absolute inset-0" />
    </div>
  );
}

/**
 * Skeleton para KPI cards/stats
 */
export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <Shimmer variant="circle" className="w-10 h-10" />
            <Shimmer variant="text" className="w-16" />
          </div>
          <Shimmer variant="text" className="w-24 h-8 mb-2" />
          <Shimmer variant="text" className="w-32 h-3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para tabla de leads/proyectos
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-[var(--border-subtle)]">
        {Array.from({ length: columns }).map((_, i) => (
          <Shimmer key={i} variant="text" className="flex-1 h-4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 items-center py-3">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Shimmer
              key={colIdx}
              variant="text"
              className={`flex-1 h-${colIdx === 0 ? "5" : "4"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para cards de proyectos
 */
export function ProjectCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5">
          <Shimmer variant="card" className="w-full mb-4" />
          <Shimmer variant="text" className="w-3/4 h-6 mb-2" />
          <Shimmer variant="text" className="w-1/2 h-4 mb-4" />
          <div className="flex gap-2">
            <Shimmer variant="text" className="w-16 h-6" />
            <Shimmer variant="text" className="w-16 h-6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para panel detail (sidebar)
 */
export function DetailPanelSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <Shimmer variant="circle" className="w-12 h-12" />
        <div className="flex-1">
          <Shimmer variant="text" className="w-32 h-5 mb-2" />
          <Shimmer variant="text" className="w-24 h-4" />
        </div>
      </div>

      {/* Sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Shimmer variant="text" className="w-20 h-3" />
          <Shimmer variant="text" className="w-full h-4" />
          <Shimmer variant="text" className="w-3/4 h-4" />
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Shimmer variant="text" className="flex-1 h-10 rounded-lg" />
        <Shimmer variant="text" className="w-20 h-10 rounded-lg" />
      </div>
    </div>
  );
}
