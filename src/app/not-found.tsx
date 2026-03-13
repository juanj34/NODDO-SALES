import Link from "next/link";
import { NodDoLogo } from "@/components/ui/NodDoLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center px-4 relative">
      {/* Grid + noise atmosphere */}
      <div className="bg-grid-lines-subtle fixed inset-0 pointer-events-none" />
      <div className="bg-noise fixed inset-0 pointer-events-none" />

      <div className="text-center max-w-md relative z-10">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <NodDoLogo height={28} colorNod="#f4f0e8" colorDo="#b8973a" />
        </div>

        {/* 404 number */}
        <h1 className="font-heading text-[80px] font-light text-[var(--site-primary)] leading-none mb-4 tracking-wide">
          404
        </h1>

        {/* Message */}
        <p className="font-heading text-2xl font-light text-[rgba(244,240,232,0.92)] mb-2 tracking-wide">
          Pagina no encontrada
        </p>
        <p className="font-body text-[13px] font-light text-[rgba(244,240,232,0.35)] mb-8 leading-relaxed">
          La pagina que buscas no existe o ha sido movida.
        </p>

        {/* Back home link */}
        <Link
          href="/"
          className="btn-noddo inline-block px-8 py-3 font-ui text-[11px] font-bold uppercase tracking-[0.15em]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
