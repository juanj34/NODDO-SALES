"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function SiteError({
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#0A0A0B",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <span style={{ color: "#ef4444", fontSize: 20 }}>!</span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: 24,
            fontWeight: 300,
            color: "rgba(255, 255, 255, 0.92)",
            marginBottom: 8,
          }}
        >
          Error al cargar
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)",
            fontSize: 13,
            fontWeight: 300,
            color: "rgba(255, 255, 255, 0.35)",
            marginBottom: 32,
            lineHeight: 1.7,
          }}
        >
          Ha ocurrido un error al cargar esta página.
        </p>

        <button
          onClick={() => reset()}
          style={{
            padding: "12px 32px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 255, 255, 0.85)",
            fontFamily: "var(--font-syne, 'Syne', sans-serif)",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.15em",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            cursor: "pointer",
          }}
        >
          Recargar
        </button>
      </div>
    </div>
  );
}
