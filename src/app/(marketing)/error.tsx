"use client";

import { useEffect } from "react";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[marketing] Error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#141414",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 28,
              letterSpacing: "0.15em",
              fontWeight: 300,
            }}
          >
            <span style={{ color: "#f4f0e8" }}>NOD</span>
            <span style={{ color: "#b8973a" }}>DO</span>
          </span>
        </div>

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
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 24,
            fontWeight: 300,
            color: "rgba(244, 240, 232, 0.92)",
            marginBottom: 8,
          }}
        >
          Algo salió mal
        </h1>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            fontWeight: 300,
            color: "rgba(244, 240, 232, 0.35)",
            marginBottom: 32,
            lineHeight: 1.7,
          }}
        >
          Ha ocurrido un error inesperado.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => reset()}
            style={{
              padding: "12px 28px",
              backgroundColor: "#b8973a",
              color: "#141414",
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase" as const,
              letterSpacing: "0.15em",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            style={{
              padding: "12px 28px",
              backgroundColor: "transparent",
              color: "rgba(244, 240, 232, 0.55)",
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase" as const,
              letterSpacing: "0.15em",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
