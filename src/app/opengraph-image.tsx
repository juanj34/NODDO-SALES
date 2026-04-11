import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "NODDO — Sala de Ventas Digital para Constructoras";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0a0a0b 0%, #141414 50%, #1a1a1a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(184,151,58,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(184,151,58,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Gold accent line */}
        <div
          style={{
            width: 80,
            height: 3,
            background: "#b8973a",
            borderRadius: 4,
            marginBottom: 32,
          }}
        />

        {/* Logo text */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
          <span style={{ fontSize: 72, fontWeight: 300, color: "rgba(244,240,232,0.92)", letterSpacing: "-0.02em" }}>
            Nod
          </span>
          <span style={{ fontSize: 72, fontWeight: 300, color: "#b8973a", letterSpacing: "-0.02em" }}>
            Do
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 28,
            color: "rgba(244,240,232,0.55)",
            fontWeight: 400,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            marginTop: 0,
          }}
        >
          Sala de Ventas Digital
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: 18,
            color: "rgba(244,240,232,0.35)",
            fontWeight: 400,
            marginTop: 16,
            maxWidth: 600,
            textAlign: "center" as const,
            lineHeight: 1.6,
          }}
        >
          Micrositios inmobiliarios premium para constructoras. Inventario en vivo, cotizador y leads calificados.
        </p>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #b8973a, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
