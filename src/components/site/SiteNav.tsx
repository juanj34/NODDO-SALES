"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  Layers,
  Package,
  Building2,
  MapPin,
  Film,
  FileText,
  Globe,
  MessageCircle,
  Map as MapIcon,
  HardHat,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AudioMuteButton } from "@/components/site/AudioPlayer";
import { NodDoLogo } from "@/components/ui/NodDoLogo";

interface SiteNavProps {
  basePath: string;
  projectName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  constructoraLogoUrl?: string | null;
  constructoraWebsite?: string | null;
  expanded: boolean;
  disclaimer?: string;
  politicaPrivacidadUrl?: string | null;
  etapaLabel?: string;
  hasImplantaciones?: boolean;
  hasTour360?: boolean;
  hasAvances?: boolean;
  hideNoddoBadge?: boolean;
}

export function SiteNav({ basePath, projectName, logoUrl, faviconUrl, constructoraLogoUrl, constructoraWebsite, expanded, disclaimer, politicaPrivacidadUrl, etapaLabel, hasImplantaciones, hasTour360, hasAvances, hideNoddoBadge }: SiteNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { t: tNav } = useTranslation("nav");
  const { t: tCommon } = useTranslation("common");

  const torreLabel = etapaLabel || tNav("torre");

  const navItems = [
    { label: tNav("galeria"), href: "/galeria", Icon: ImageIcon },
    { label: tNav("tipologias"), href: "/tipologias", Icon: Layers },
    { label: tNav("inventario"), href: "/inventario", Icon: Package },
    { label: torreLabel, href: "/explorar", Icon: Building2 },
    ...(hasImplantaciones ? [{ label: tNav("implantaciones"), href: "/implantaciones", Icon: MapIcon }] : []),
    { label: tNav("ubicacion"), href: "/ubicacion", Icon: MapPin },
    { label: tNav("videos"), href: "/videos", Icon: Film },
    { label: tNav("recursos"), href: "/recursos", Icon: FileText },
    ...(hasAvances ? [{ label: tNav("avances"), href: "/avances", Icon: HardHat }] : []),
    ...(hasTour360 ? [{ label: tNav("tour360"), href: "/tour-360", Icon: Globe }] : []),
    { label: tNav("contacto"), href: "/contacto", Icon: MessageCircle },
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
          {!expanded && faviconUrl ? (
            <img
              src={faviconUrl}
              alt={projectName}
              className="h-7 w-7 rounded-md object-cover flex-shrink-0"
            />
          ) : logoUrl ? (
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

                  <item.Icon className="flex-shrink-0" size={20} strokeWidth={1.5} />

                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-ui text-[11px] tracking-[0.08em] uppercase font-semibold truncate"
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
                        <span className="font-ui text-[10px] tracking-[0.1em] uppercase text-white/80 font-semibold">
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

        {/* Language toggle + Audio mute */}
        <div className={cn("flex-shrink-0 mt-3 flex items-center gap-2", expanded ? "px-4 w-full justify-center" : "flex-col")}>
          <LanguageToggle compact={!expanded} />
          <AudioMuteButton size={14} />
        </div>

        {/* Powered by Noddo */}
        {!hideNoddoBadge && (
          <a
            href="https://noddo.io"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex-shrink-0 mt-3 flex flex-col items-center gap-0.5 no-underline opacity-25 hover:opacity-50 transition-opacity",
              expanded ? "px-4" : "px-1"
            )}
          >
            {expanded && (
              <span className="text-[7px] tracking-[0.15em] uppercase text-white/50">
                powered by
              </span>
            )}
            <NodDoLogo width={expanded ? 56 : 32} colorNod="#fff" colorDo="#b8983c" />
          </a>
        )}

      </motion.nav>
    </>
  );
}
