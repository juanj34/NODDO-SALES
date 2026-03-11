"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/i18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

interface SiteNavProps {
  basePath: string;
  projectName: string;
  logoUrl?: string | null;
  constructoraLogoUrl?: string | null;
  constructoraWebsite?: string | null;
  expanded: boolean;
  onToggle: () => void;
  disclaimer?: string;
  politicaPrivacidadUrl?: string | null;
  etapaLabel?: string;
  hasImplantaciones?: boolean;
  hasTour360?: boolean;
}

// Custom SVG icon components — 20x20 viewbox, stroke-only
function IconGaleria({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconTipologias({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="10" y1="3" x2="10" y2="10" />
      <line x1="7" y1="10" x2="7" y2="17" />
    </svg>
  );
}

function IconInventario({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <line x1="4" y1="4" x2="16" y2="4" />
      <line x1="4" y1="8" x2="16" y2="8" />
      <line x1="4" y1="12" x2="16" y2="12" />
      <line x1="4" y1="16" x2="16" y2="16" />
      <circle cx="2" cy="4" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="2" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="2" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="2" cy="16" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconTorre({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <rect x="4" y="2" width="12" height="16" rx="1.5" />
      <line x1="4" y1="6" x2="16" y2="6" />
      <line x1="4" y1="10" x2="16" y2="10" />
      <line x1="4" y1="14" x2="16" y2="14" />
      <line x1="10" y1="2" x2="10" y2="18" />
    </svg>
  );
}

function IconUbicacion({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <path d="M10 18S3 12 3 7.5a7 7 0 0 1 14 0C17 12 10 18 10 18z" />
      <circle cx="10" cy="7.5" r="2.5" />
    </svg>
  );
}

function IconVideos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <polygon points="8,7 14,10 8,13" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconRecursos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <path d="M2 5a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z" />
    </svg>
  );
}

function IconTour360({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <circle cx="10" cy="10" r="7.5" />
      <ellipse cx="10" cy="10" rx="3" ry="7.5" />
      <line x1="2.5" y1="10" x2="17.5" y2="10" />
    </svg>
  );
}

function IconContacto({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <path d="M3 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <polyline points="1,4 10,11 19,4" />
    </svg>
  );
}

function IconImplantaciones({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <rect x="2" y="2" width="16" height="16" rx="2" />
      <rect x="5" y="5" width="4" height="5" rx="0.5" />
      <rect x="11" y="5" width="4" height="5" rx="0.5" />
      <rect x="5" y="12" width="4" height="4" rx="0.5" />
      <rect x="11" y="12" width="4" height="4" rx="0.5" />
    </svg>
  );
}

function IconUrbanismo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)}>
      <path d="M2 18h16" />
      <path d="M4 18V8l4-3v13" />
      <path d="M8 18V5l4 3v10" />
      <path d="M12 18V8l4-3v13" />
    </svg>
  );
}

export function SiteNav({ basePath, projectName, logoUrl, constructoraLogoUrl, constructoraWebsite, expanded, onToggle, disclaimer, politicaPrivacidadUrl, etapaLabel, hasImplantaciones, hasTour360 }: SiteNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { t: tNav } = useTranslation("nav");
  const { t: tCommon } = useTranslation("common");

  const torreLabel = etapaLabel || tNav("torre");

  const navItems = [
    { label: tNav("galeria"), href: "/galeria", Icon: IconGaleria },
    { label: tNav("tipologias"), href: "/tipologias", Icon: IconTipologias },
    { label: tNav("inventario"), href: "/inventario", Icon: IconInventario },
    { label: torreLabel, href: "/explorar", Icon: IconTorre },
    ...(hasImplantaciones ? [{ label: tNav("implantaciones"), href: "/implantaciones", Icon: IconImplantaciones }] : []),
    { label: tNav("ubicacion"), href: "/ubicacion", Icon: IconUbicacion },
    { label: tNav("videos"), href: "/videos", Icon: IconVideos },
    { label: tNav("recursos"), href: "/recursos", Icon: IconRecursos },
    ...(hasTour360 ? [{ label: tNav("tour360"), href: "/tour-360", Icon: IconTour360 }] : []),
    { label: tNav("contacto"), href: "/contacto", Icon: IconContacto },
  ];

  const sidebarWidth = expanded ? 200 : 60;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? tCommon("accessibility.closeMenu") : tCommon("accessibility.openMenu")}
        className="fixed top-6 left-6 z-[60] lg:hidden w-10 h-10 flex items-center justify-center glass rounded-xl cursor-pointer"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5 text-white">
          {isOpen ? (
            <>
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </>
          ) : (
            <>
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="17" y2="15" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[49] bg-black/60 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.nav
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-[55] flex flex-col items-center py-6 overflow-hidden",
          "bg-[var(--surface-1)]/90 backdrop-blur-2xl border-r border-[var(--border-subtle)]",
          "lg:translate-x-0 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Project logo / name */}
        <Link
          href={basePath || "/"}
          onClick={() => setIsOpen(false)}
          className={cn(
            "mb-5 flex-shrink-0 flex items-center cursor-pointer hover:opacity-80 transition-opacity",
            expanded ? "px-4 w-full justify-center flex-col gap-1" : "justify-center gap-2.5"
          )}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={projectName}
              className={cn(
                "object-contain flex-shrink-0",
                expanded ? "h-14 max-w-[160px]" : "h-7 w-7 rounded-md"
              )}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(var(--site-primary-rgb), 0.12)",
                border: "1px solid rgba(var(--site-primary-rgb), 0.2)",
              }}
            >
              <span className="font-site-heading text-sm font-semibold text-[var(--site-primary)]">
                {projectName.charAt(0)}
              </span>
            </div>
          )}
          {expanded && !logoUrl && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-medium text-[var(--text-secondary)] tracking-wider truncate"
            >
              {projectName}
            </motion.span>
          )}
        </Link>

        {/* Separator */}
        <div className={cn("h-px bg-[var(--border-subtle)] mb-3 flex-shrink-0", expanded ? "w-[calc(100%-2rem)] mx-4" : "w-5")} />

        {/* Nav items */}
        <div className="flex-1 flex flex-col items-stretch gap-0.5 w-full overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const fullPath = `${basePath}${item.href}`;
            const isActive = pathname.startsWith(fullPath);
            const isHovered = hoveredItem === item.href;

            return (
              <div key={item.href} className="relative px-2">
                <Link
                  href={fullPath}
                  onClick={() => setIsOpen(false)}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer",
                    expanded ? "px-3 py-2.5" : "justify-center w-10 h-10 mx-auto",
                    isActive
                      ? "text-white"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04]"
                  )}
                >
                  {/* Active indicator — left accent bar with subtle glow */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 w-[3px] h-5 bg-[var(--site-primary)] rounded-r-full"
                      style={{
                        left: expanded ? "-8px" : "-10px",
                        boxShadow: "0 0 8px rgba(var(--site-primary-rgb), 0.4), 0 0 20px rgba(var(--site-primary-rgb), 0.15)",
                      }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}

                  <item.Icon className="flex-shrink-0" />

                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] tracking-[0.1em] uppercase font-medium truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>

                {/* Tooltip — only in compact mode */}
                {!expanded && (
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[60] glass-dark px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none"
                      >
                        <span className="text-[10px] tracking-[0.15em] uppercase text-white/80 font-medium">
                          {item.label}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>

        {/* Constructora logo — only in expanded mode */}
        {expanded && constructoraLogoUrl && (
          <div className="px-4 mb-3 flex-shrink-0 flex justify-center">
            {constructoraWebsite ? (
              <a href={constructoraWebsite} target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">
                <img
                  src={constructoraLogoUrl}
                  alt="Constructora"
                  className="h-6 w-auto object-contain opacity-40 hover:opacity-60 transition-opacity"
                />
              </a>
            ) : (
              <img
                src={constructoraLogoUrl}
                alt="Constructora"
                className="h-6 w-auto object-contain opacity-40"
              />
            )}
          </div>
        )}

        {/* Disclaimer — only in expanded mode */}
        {expanded && disclaimer && (
          <p className="px-4 mb-2 text-[9px] text-[var(--text-muted)] leading-relaxed flex-shrink-0">
            {disclaimer}
          </p>
        )}

        {/* Privacy policy link */}
        {expanded && politicaPrivacidadUrl && (
          <a
            href={politicaPrivacidadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 mb-2 text-[9px] text-[var(--text-muted)] hover:text-[var(--site-primary)] underline underline-offset-2 transition-colors flex-shrink-0"
          >
            {tNav("privacyPolicy")}
          </a>
        )}

        {/* Language toggle */}
        <div className={cn("flex-shrink-0 mt-3", expanded ? "px-4 w-full flex justify-center" : "")}>
          <LanguageToggle compact={!expanded} />
        </div>

        {/* Toggle button */}
        <div className={cn("flex-shrink-0 mt-2", expanded ? "px-4 w-full" : "")}>
          <button
            onClick={onToggle}
            aria-label={expanded ? tCommon("accessibility.collapseMenu") : tCommon("accessibility.expandMenu")}
            className={cn(
              "flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
              expanded ? "w-full py-2 gap-2" : "w-8 h-8 mx-auto"
            )}
          >
            {expanded ? (
              <>
                <ChevronLeft size={14} />
                <span className="text-[10px] tracking-wider uppercase">{tCommon("buttons.compact")}</span>
              </>
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        </div>
      </motion.nav>
    </>
  );
}
