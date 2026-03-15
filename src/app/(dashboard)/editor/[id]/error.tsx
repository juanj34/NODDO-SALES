"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function EditorError({
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
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
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
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 24,
            fontWeight: 300,
            color: "rgba(244, 240, 232, 0.92)",
            marginBottom: 8,
          }}
        >
          Error en el editor
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
          Ha ocurrido un error al cargar esta sección. Tus cambios guardados están a salvo.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => reset()}
            style={{
              padding: "12px 28px",
              backgroundColor: "var(--site-primary)",
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
            href="/proyectos"
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
            Volver a proyectos
          </a>
        </div>
      </div>
    </div>
  );
}
