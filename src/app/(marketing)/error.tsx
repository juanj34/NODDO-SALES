"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { NodDoLogo } from "@/components/ui/NodDoLogo";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-[#141414]">
      <div className="text-center max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <NodDoLogo height={28} colorNod="#f4f0e8" colorDo="#b8973a" />
        </div>

        {/* Error icon */}
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 inline-flex items-center justify-center mb-6">
          <span className="text-red-500 text-xl">!</span>
        </div>

        <h1 className="font-heading text-2xl font-light text-[rgba(244,240,232,0.92)] mb-2">
          Algo salió mal
        </h1>
        <p className="font-body text-[13px] font-light text-[rgba(244,240,232,0.35)] mb-8 leading-relaxed">
          Ha ocurrido un error inesperado.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="btn-noddo px-7 py-3 font-ui text-[11px] font-bold uppercase tracking-[0.15em]"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-block px-7 py-3 bg-transparent text-[rgba(244,240,232,0.55)] font-ui text-[11px] font-bold uppercase tracking-[0.15em] rounded-[8px] border border-white/10 no-underline hover:border-white/20 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
