import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* NODDO Logo text */}
        <div className="mb-8">
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "28px",
              letterSpacing: "0.15em",
              fontWeight: 300,
            }}
          >
            <span style={{ color: "#f4f0e8" }}>NOD</span>
            <span style={{ color: "#b8973a" }}>DO</span>
          </span>
        </div>

        {/* 404 number */}
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "80px",
            fontWeight: 300,
            color: "#b8973a",
            lineHeight: 1,
            marginBottom: "16px",
            letterSpacing: "0.05em",
          }}
        >
          404
        </h1>

        {/* Message */}
        <p
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "24px",
            fontWeight: 300,
            color: "rgba(244, 240, 232, 0.92)",
            marginBottom: "8px",
            letterSpacing: "0.02em",
          }}
        >
          Pagina no encontrada
        </p>
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
          La pagina que buscas no existe o ha sido movida.
        </p>

        {/* Back home link */}
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "12px 32px",
            backgroundColor: "#b8973a",
            color: "#141414",
            fontFamily: "'Syne', sans-serif",
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
