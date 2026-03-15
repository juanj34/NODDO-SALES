"use client";

interface Props {
  estado: string;
}

const STATUS_CONFIG = {
  publicado: {
    label: "Publicado",
    bg: "bg-green-500/15",
    text: "text-green-400",
    dot: "bg-green-400",
    border: "border-green-500/20",
    pulse: true,
  },
  borrador: {
    label: "Borrador",
    bg: "bg-[rgba(var(--site-primary-rgb),0.15)]",
    text: "text-[var(--site-primary)]",
    dot: "bg-[var(--site-primary)]",
    border: "border-[rgba(var(--site-primary-rgb),0.25)]",
    pulse: false,
  },
  archivado: {
    label: "Archivado",
    bg: "bg-gray-500/15",
    text: "text-gray-400",
    dot: "bg-gray-400",
    border: "border-gray-500/20",
    pulse: false,
  },
};

export function ProjectStatusBadge({ estado }: Props) {
  const config = STATUS_CONFIG[estado as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.borrador;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1
        rounded-full
        border
        font-mono text-xs font-medium
        ${config.bg}
        ${config.text}
        ${config.border}
      `}
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`}></span>
      </span>
      <span className="uppercase text-[10px] tracking-wider font-bold">
        {config.label}
      </span>
    </div>
  );
}
