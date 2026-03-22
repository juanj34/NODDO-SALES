"use client";

import Image from "next/image";
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
  Settings,
  Info,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AudioMuteButton } from "@/components/site/AudioPlayer";
import { CurrencySelector } from "@/components/site/CurrencySelector";
import { UnitToggle } from "@/components/site/UnitToggle";


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
}

export function SiteNav({ basePath, projectName, logoUrl, faviconUrl, constructoraLogoUrl, constructoraWebsite, expanded, disclaimer, politicaPrivacidadUrl, etapaLabel, hasImplantaciones, hasTour360, hasAvances }: SiteNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5 text-[var(--text-primary)]">
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
            className="fixed inset-0 z-[49] lg:hidden"
            style={{ backgroundColor: "rgba(var(--overlay-rgb), 0.6)" }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.nav
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-[55] flex flex-col items-center py-6 overflow-hidden",
          "bg-[var(--surface-1)]/95 backdrop-blur-3xl",
          "border-r border-[var(--border-default)]",
          "shadow-[var(--shadow-lg),inset_1px_0_0_rgba(255,255,255,0.04)]",
          "lg:translate-x-0 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Project logo / name */}
        <Link
          href={basePath || "/"}
          onClick={() => setIsOpen(false)}
          className={cn(
            "mb-5 flex-shrink-0 flex items-center cursor-pointer transition-all duration-200",
            "hover:opacity-90 hover:brightness-110",
            expanded ? "px-4 w-full justify-center flex-col gap-1" : "justify-center gap-2.5"
          )}
        >
          {!expanded && faviconUrl ? (
            <Image src={faviconUrl} alt="" width={400} height={300} className="h-7 w-7 rounded-md object-cover flex-shrink-0" />
          ) : logoUrl ? (
            <Image src={logoUrl} alt="" width={400} height={300} className={cn(
                "object-contain flex-shrink-0",
                expanded ? "h-14 max-w-[160px]" : "h-7 w-7 rounded-md"
              )} />
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
        <motion.div
          animate={{ width: expanded ? "calc(100% - 2rem)" : "1.25rem" }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className={cn("h-px bg-[var(--border-subtle)] mb-3 flex-shrink-0", expanded ? "mx-4" : "")}
        />

        {/* Nav items */}
        <div className="flex-1 flex flex-col items-stretch gap-0.5 w-full overflow-y-auto scroll-smooth scrollbar-hide">
          {navItems.map((item, idx) => {
            const fullPath = `${basePath}${item.href}`;
            const isActive = pathname.startsWith(fullPath);
            const isHovered = hoveredItem === item.href;

            return (
              <motion.div
                key={item.href}
                className="relative px-2"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3, ease: "easeOut" }}
              >
                <Link
                  href={fullPath}
                  onClick={() => setIsOpen(false)}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer",
                    expanded ? "px-3 py-2.5" : "justify-center w-10 h-10 mx-auto",
                    isActive
                      ? "text-white bg-[rgba(var(--site-primary-rgb),0.12)] border border-[rgba(var(--site-primary-rgb),0.25)]"
                      : "text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-2)] hover:border-[var(--border-default)] border border-transparent"
                  )}
                >
                  {/* Active indicator — left accent bar with subtle glow */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 w-[3px] h-5 bg-[var(--site-primary)] rounded-r-full"
                      style={{
                        left: expanded ? "-8px" : "-10px",
                        boxShadow: "0 0 12px rgba(var(--site-primary-rgb), 0.6), 0 0 28px rgba(var(--site-primary-rgb), 0.25), 0 0 48px rgba(var(--site-primary-rgb), 0.1)",
                      }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[60] glass-dark px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none border border-[var(--border-default)] shadow-[var(--shadow-md)]"
                      >
                        <span className="font-ui text-[10px] tracking-[0.1em] uppercase font-semibold text-white">
                          {item.label}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer: Settings + Legal + Logos */}
        <div className={cn("flex-shrink-0 mt-3", expanded ? "px-4 w-full space-y-3" : "flex flex-col items-center gap-2.5")}>

          {/* Top row: Settings gear + Info icon */}
          <div className={cn("flex items-center gap-2", expanded ? "w-full" : "")}>
            {/* Settings popover trigger */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                onBlur={() => setTimeout(() => setShowSettings(false), 150)}
                className={cn(
                  "flex items-center justify-center rounded-xl transition-all cursor-pointer border",
                  expanded ? "w-9 h-9" : "w-10 h-10",
                  showSettings
                    ? "bg-[rgba(var(--site-primary-rgb),0.12)] border-[rgba(var(--site-primary-rgb),0.25)] text-[var(--site-primary)] shadow-[var(--glow-xs)]"
                    : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-white hover:border-[var(--border-default)] hover:bg-[var(--surface-3)]"
                )}
                aria-label="Settings"
              >
                <Settings size={expanded ? 14 : 16} strokeWidth={1.5} />
              </button>

              {/* Settings panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.94 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={cn(
                      "absolute z-[60] glass-card rounded-xl p-3 space-y-2.5",
                      expanded ? "bottom-full mb-2 left-0" : "left-full ml-3 bottom-0"
                    )}
                    style={{ minWidth: "160px" }}
                  >
                    <div className="flex flex-col gap-2">
                      {/* Language */}
                      <div>
                        <label className="block text-[8px] font-ui uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1.5">
                          {tCommon("language")}
                        </label>
                        <LanguageToggle compact={false} />
                      </div>

                      {/* Currency */}
                      <div>
                        <label className="block text-[8px] font-ui uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1.5">
                          {tCommon("currency")}
                        </label>
                        <CurrencySelector />
                      </div>

                      {/* Units */}
                      <div>
                        <label className="block text-[8px] font-ui uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1.5">
                          {tCommon("units")}
                        </label>
                        <UnitToggle />
                      </div>

                      {/* Separator */}
                      <div className="h-px bg-[var(--border-subtle)]" />

                      {/* Audio */}
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] font-ui uppercase tracking-[0.12em] text-[var(--text-muted)]">
                          {tCommon("audio")}
                        </label>
                        <AudioMuteButton size={14} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Info icon for disclaimer/privacy */}
            {(disclaimer || politicaPrivacidadUrl) && (
              <button
                onClick={() => setShowDisclaimer(true)}
                className={cn(
                  "flex items-center justify-center rounded-xl transition-all cursor-pointer border",
                  expanded ? "w-9 h-9" : "w-10 h-10",
                  "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] hover:border-[var(--border-default)] hover:bg-[var(--surface-3)]"
                )}
                aria-label="Legal information"
              >
                <Info size={expanded ? 14 : 16} strokeWidth={1.5} />
              </button>
            )}

            {expanded && <div className="flex-1" />}
          </div>

          {/* Bottom row: Constructora logo */}
          {constructoraLogoUrl && (
            <div className="flex items-center justify-center">
              {constructoraWebsite ? (
                <a
                  href={constructoraWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-30 hover:opacity-60 transition-all duration-200 hover:brightness-110"
                >
                  <Image
                    src={constructoraLogoUrl}
                    alt="Constructora"
                    width={400}
                    height={300}
                    className={cn(
                      "object-contain",
                      expanded ? "h-5 w-auto max-w-[80px]" : "h-4 w-auto max-w-[50px]"
                    )}
                  />
                </a>
              ) : (
                <div className="opacity-30">
                  <Image
                    src={constructoraLogoUrl}
                    alt="Constructora"
                    width={400}
                    height={300}
                    className={cn(
                      "object-contain",
                      expanded ? "h-5 w-auto max-w-[80px]" : "h-4 w-auto max-w-[50px]"
                    )}
                  />
                </div>
              )}
            </div>
          )}
        </div>

      </motion.nav>

      {/* Legal info modal (Disclaimer + Privacy) */}
      <AnimatePresence>
        {showDisclaimer && (disclaimer || politicaPrivacidadUrl) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6"
            onClick={() => setShowDisclaimer(false)}
          >
            <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: "rgba(var(--overlay-rgb), 0.7)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative glass-card max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-ui text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-secondary)]">
                  {tNav("legalInfo")}
                </h3>
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--glass-bg-hover)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5">
                    <line x1="4" y1="4" x2="12" y2="12" />
                    <line x1="12" y1="4" x2="4" y2="12" />
                  </svg>
                </button>
              </div>

              {disclaimer && (
                <div className="mb-4">
                  <h4 className="font-ui text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)] mb-2">
                    Disclaimer
                  </h4>
                  <p className="font-mono text-[11px] text-[var(--text-tertiary)] leading-[1.8]">
                    {disclaimer}
                  </p>
                </div>
              )}

              {politicaPrivacidadUrl && (
                <a
                  href={politicaPrivacidadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] font-ui uppercase tracking-[0.1em] text-[var(--site-primary)] hover:opacity-70 transition-opacity"
                >
                  {tNav("privacyPolicy")}
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3 h-3">
                    <path d="M12 4L4 12M12 4v6M12 4H6" />
                  </svg>
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
