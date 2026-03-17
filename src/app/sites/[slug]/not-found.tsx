import Link from "next/link";

export default function SiteNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--site-bg, #0a0a0a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        {/* 404 */}
        <h1
          style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "72px",
            fontWeight: 300,
            color: "var(--site-primary, #b8973a)",
            lineHeight: 1,
            marginBottom: "16px",
            letterSpacing: "0.05em",
          }}
        >
          404
        </h1>

        <p
          style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "22px",
            fontWeight: 300,
            color: "rgba(244, 240, 232, 0.92)",
            marginBottom: "8px",
            letterSpacing: "0.02em",
          }}
        >
          Proyecto no encontrado
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)",
            fontSize: "13px",
            fontWeight: 300,
            color: "rgba(244, 240, 232, 0.35)",
            marginBottom: "32px",
            lineHeight: 1.7,
          }}
        >
          El proyecto que buscas no existe o no esta disponible.
        </p>

        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "12px 32px",
            backgroundColor: "var(--site-primary, #b8973a)",
            color: "#141414",
            fontFamily: "var(--font-syne, 'Syne', sans-serif)",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.15em",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
