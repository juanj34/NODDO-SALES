import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal - NODDO",
  description: "Términos legales, privacidad y políticas de NODDO",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver a NODDO
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[var(--text-tertiary)]">
            <p>© {new Date().getFullYear()} NODDO. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <Link
                href="/legal/privacidad"
                className="hover:text-white transition-colors"
              >
                Privacidad
              </Link>
              <Link
                href="/legal/terminos"
                className="hover:text-white transition-colors"
              >
                Términos
              </Link>
              <a
                href="mailto:hola@noddo.io"
                className="hover:text-white transition-colors"
              >
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
