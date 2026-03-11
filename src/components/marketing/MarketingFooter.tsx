import Link from "next/link";

const productoLinks = [
  { label: "Caracteristicas", href: "#capacidades" },
  { label: "Precios", href: "/pricing" },
  { label: "Demo", href: "/sites/alto-de-yeguas" },
];

const empresaLinks = [
  { label: "Contacto", href: "mailto:hola@noddo.co" },
  { label: "Blog", href: "#" },
];

export function MarketingFooter() {
  return (
    <footer className="bg-[var(--mk-bg-dark)]">
      {/* Top rule */}
      <div className="h-px w-full bg-white/10" />

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Column 1: Brand */}
          <div>
            <span className="font-heading tracking-[0.18em] text-lg text-white font-bold">
              NODDO
            </span>
            <p className="mt-3 text-sm text-white/40">
              Micrositios inmobiliarios premium
            </p>
          </div>

          {/* Column 2: Producto */}
          <div>
            <h4 className="text-xs font-medium tracking-wide uppercase text-white/30 mb-4">
              Producto
            </h4>
            <ul className="flex flex-col gap-3">
              {productoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Empresa */}
          <div>
            <h4 className="text-xs font-medium tracking-wide uppercase text-white/30 mb-4">
              Empresa
            </h4>
            <ul className="flex flex-col gap-3">
              {empresaLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <p className="text-xs text-white/25">
            &copy; 2026 Noddo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
