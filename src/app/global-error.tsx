"use client";

import { NodDoLogo } from "@/components/ui/NodDoLogo";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#0a0a0a" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            {/* NODDO Logo */}
            <div style={{ marginBottom: "32px", display: "flex", justifyContent: "center" }}>
              <NodDoLogo height={28} colorNod="#f4f0e8" colorDo="#b8973a" />
            </div>

            {/* Error icon */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <span style={{ color: "#ef4444", fontSize: "20px" }}>!</span>
            </div>

            {/* Message */}
            <h1
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "24px",
                fontWeight: 300,
                color: "rgba(244, 240, 232, 0.92)",
                marginBottom: "8px",
                letterSpacing: "0.02em",
              }}
            >
              Algo salio mal
            </h1>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "13px",
                fontWeight: 300,
                color: "rgba(244, 240, 232, 0.35)",
                marginBottom: "32px",
                lineHeight: 1.7,
              }}
            >
              Ha ocurrido un error inesperado. Intenta recargar la pagina.
            </p>

            {/* Retry button */}
            <button
              onClick={() => reset()}
              style={{
                display: "inline-block",
                padding: "12px 32px",
                backgroundColor: "#b8973a",
                color: "#141414",
                fontFamily: "'Syne', sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
