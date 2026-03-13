import { Loader2 } from "lucide-react";

export default function UbicacionLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-[var(--surface-0)]">
      <div className="flex flex-col items-center gap-4">
        <Loader2
          size={28}
          className="animate-spin text-[var(--site-primary)]"
        />
        <p className="text-xs tracking-[0.3em] uppercase text-[var(--text-muted)]">
          Cargando mapa
        </p>
      </div>
    </div>
  );
}
