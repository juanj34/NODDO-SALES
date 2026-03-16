"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n";

const smallBadges = [
  { label: "SSL", gold: true },
  { label: "GDPR", gold: false },
  { label: "99.9%", gold: true },
];

export function MarketingFooter() {
  const { t } = useTranslation("marketing");

  const productLinks = [
    { label: t("footer.productLinks.integrations"), href: "/integraciones" },
    { label: t("footer.productLinks.roadmap"), href: "/roadmap" },
    { label: t("footer.productLinks.pricing"), href: "/pricing" },
    { label: t("footer.productLinks.security"), href: "/seguridad" },
    { label: t("footer.productLinks.status"), href: "/estado" },
  ];
  const companyLinks = [
    { label: t("footer.companyLinks.about"), href: "/nosotros" },
    { label: t("footer.companyLinks.caseStudies"), href: "/casos-de-estudio" },
    { label: t("footer.companyLinks.resources"), href: "/recursos" },
    { label: t("footer.companyLinks.faq"), href: "/faq" },
    { label: t("footer.companyLinks.contact"), href: "/#contacto" },
  ];
  const legalLinks = [
    { label: t("footer.legalLinks.terms"), href: "/terminos" },
    { label: t("footer.legalLinks.privacy"), href: "/privacidad" },
    { label: t("footer.legalLinks.cookies"), href: "/privacidad#cookies" },
    { label: t("footer.legalLinks.sla"), href: "/terminos#disponibilidad" },
  ];

  return (
    <footer className="relative z-[1] px-6 lg:px-20 border-t border-[var(--mk-border-rule)] pt-12 sm:pt-20 pb-10">
      {/* Top: 4-column grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-16 pb-14 mb-14"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", maxWidth: 1200, margin: "0 auto" }}
      >
        {/* Brand column */}
        <div>
          <span
            className="font-ui text-[22px] font-extrabold tracking-[0.1em] block mb-4"
            style={{ color: "var(--mk-text-primary)" }}
          >
            NOD<span style={{ color: "var(--mk-accent)" }}>DO</span>
          </span>
          <p
            className="text-[12px] leading-[1.8] mb-6"
            style={{ color: "rgba(244,240,232,0.3)", maxWidth: 280 }}
          >
            {t("footer.tagline")}
          </p>
          <div className="flex gap-2">
            {smallBadges.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-1.5 font-ui text-[8px] tracking-[0.15em] uppercase"
                style={{
                  padding: "5px 10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(244,240,232,0.3)",
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: b.gold ? "var(--mk-accent)" : "var(--mk-available)",
                    flexShrink: 0,
                  }}
                />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Producto */}
        <div>
          <div
            className="font-ui text-[9px] font-bold tracking-[0.25em] uppercase mb-5"
            style={{ color: "rgba(244,240,232,0.25)" }}
          >
            {t("footer.product")}
          </div>
          <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0 }}>
            {productLinks.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-[12px] hover:text-[var(--mk-accent)] transition-colors"
                  style={{ color: "rgba(244,240,232,0.35)", textDecoration: "none" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Compañía */}
        <div>
          <div
            className="font-ui text-[9px] font-bold tracking-[0.25em] uppercase mb-5"
            style={{ color: "rgba(244,240,232,0.25)" }}
          >
            {t("footer.company")}
          </div>
          <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0 }}>
            {companyLinks.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-[12px] hover:text-[var(--mk-accent)] transition-colors"
                  style={{ color: "rgba(244,240,232,0.35)", textDecoration: "none" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <div
            className="font-ui text-[9px] font-bold tracking-[0.25em] uppercase mb-5"
            style={{ color: "rgba(244,240,232,0.25)" }}
          >
            {t("footer.legal")}
          </div>
          <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0 }}>
            {legalLinks.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-[12px] hover:text-[var(--mk-accent)] transition-colors"
                  style={{ color: "rgba(244,240,232,0.35)", textDecoration: "none" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <p className="text-[10px] tracking-[0.15em]" style={{ color: "rgba(244,240,232,0.15)" }}>
          {t("footer.copyright")}
        </p>
        <p className="text-[10px] tracking-[0.15em]" style={{ color: "rgba(244,240,232,0.15)" }}>
          {t("footer.contact")}
        </p>
      </div>
    </footer>
  );
}
