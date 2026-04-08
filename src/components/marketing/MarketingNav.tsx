"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  LogIn,
  ArrowRight,
  ChevronDown,
  Layers,
  Plug,
  Map,
  ShieldCheck,
  BookOpen,
  BarChart3,
  HelpCircle,
  LifeBuoy,
} from "lucide-react";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useBooking } from "./BookingProvider";
import { useTranslation } from "@/i18n";

interface DropdownItem {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

export function MarketingNav() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { openBooking } = useBooking();
  const { t } = useTranslation("marketing");

  const productItems: DropdownItem[] = [
    {
      label: t("nav.productDropdown.features"),
      description: t("nav.productDropdown.featuresDesc"),
      href: "/#capacidades",
      icon: Layers,
    },
    {
      label: t("nav.productDropdown.integrations"),
      description: t("nav.productDropdown.integrationsDesc"),
      href: "/integraciones",
      icon: Plug,
    },
    {
      label: t("nav.productDropdown.roadmap"),
      description: t("nav.productDropdown.roadmapDesc"),
      href: "/roadmap",
      icon: Map,
    },
    {
      label: t("nav.productDropdown.security"),
      description: t("nav.productDropdown.securityDesc"),
      href: "/seguridad",
      icon: ShieldCheck,
    },
  ];

  const resourceItems: DropdownItem[] = [
    {
      label: t("nav.resourcesDropdown.blog"),
      description: t("nav.resourcesDropdown.blogDesc"),
      href: "/recursos",
      icon: BookOpen,
    },
    {
      label: t("nav.resourcesDropdown.caseStudies"),
      description: t("nav.resourcesDropdown.caseStudiesDesc"),
      href: "/casos-de-estudio",
      icon: BarChart3,
    },
    {
      label: t("nav.resourcesDropdown.faq"),
      description: t("nav.resourcesDropdown.faqDesc"),
      href: "/faq",
      icon: HelpCircle,
    },
    {
      label: t("nav.resourcesDropdown.helpCenter"),
      description: t("nav.resourcesDropdown.helpCenterDesc"),
      href: "/ayuda",
      icon: LifeBuoy,
    },
  ];

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    if (currentY < 80) {
      setVisible(true);
    } else if (currentY > lastScrollY) {
      setVisible(false);
      setMobileOpen(false);
      setOpenDropdown(null);
    } else {
      setVisible(true);
    }
    setLastScrollY(currentY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleDropdownEnter = (key: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(key);
  };

  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const linkClasses =
    "text-[11px] font-semibold tracking-[0.18em] uppercase text-[rgba(244,240,232,0.4)] hover:text-[var(--mk-accent)] transition-colors duration-200";

  return (
    <motion.header
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background:
          "linear-gradient(to bottom, rgba(20, 20, 20, 0.9), transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <nav className="px-6 lg:px-24 py-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" aria-label="NODDO Home">
          <NodDoLogo height={18} />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {/* Producto dropdown */}
          <li
            className="relative"
            onMouseEnter={() => handleDropdownEnter("product")}
            onMouseLeave={handleDropdownLeave}
          >
            <button className={`${linkClasses} inline-flex items-center gap-1`}>
              {t("nav.product")}
              <ChevronDown
                size={10}
                strokeWidth={2.5}
                className={`transition-transform duration-200 ${openDropdown === "product" ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {openDropdown === "product" && (
                <DropdownPanel items={productItems} />
              )}
            </AnimatePresence>
          </li>

          {/* Recursos dropdown */}
          <li
            className="relative"
            onMouseEnter={() => handleDropdownEnter("resources")}
            onMouseLeave={handleDropdownLeave}
          >
            <button className={`${linkClasses} inline-flex items-center gap-1`}>
              {t("nav.resources")}
              <ChevronDown
                size={10}
                strokeWidth={2.5}
                className={`transition-transform duration-200 ${openDropdown === "resources" ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {openDropdown === "resources" && (
                <DropdownPanel items={resourceItems} />
              )}
            </AnimatePresence>
          </li>

          {/* Direct links */}
          <li>
            <Link href="/pricing" className={linkClasses}>
              {t("nav.pricing")}
            </Link>
          </li>
          <li>
            <Link href="/nosotros" className={linkClasses}>
              {t("nav.about")}
            </Link>
          </li>
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <LanguageToggle compact className="hidden sm:flex" />
          <Link
            href="/login"
            className="hidden md:inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-[rgba(244,240,232,0.4)] hover:text-[var(--mk-accent)] transition-colors duration-200"
          >
            <LogIn size={13} strokeWidth={2} />
            {t("nav.login")}
          </Link>
          <button
            onClick={openBooking}
            className="btn-mk-primary text-[10px] py-2.5 px-5 hidden md:inline-flex items-center gap-2"
          >
            {t("nav.bookCall")}
            <ArrowRight size={12} strokeWidth={2.5} />
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden flex flex-col gap-1.5 p-2 min-w-[44px] min-h-[44px] items-center justify-center hover:bg-[rgba(255,255,255,0.05)] active:bg-[rgba(255,255,255,0.1)] rounded transition-colors"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={
                mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }
              }
              className="block w-5 h-px bg-[var(--mk-text-secondary)]"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-5 h-px bg-[var(--mk-text-secondary)]"
            />
            <motion.span
              animate={
                mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }
              }
              className="block w-5 h-px bg-[var(--mk-text-secondary)]"
            />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-[var(--mk-border-rule)]"
            style={{
              background: "rgba(20, 20, 20, 0.95)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-2">
              {/* Producto accordion */}
              <MobileAccordion
                label={t("nav.product")}
                items={productItems}
                expanded={mobileExpanded === "product"}
                onToggle={() =>
                  setMobileExpanded((prev) =>
                    prev === "product" ? null : "product"
                  )
                }
                onNavigate={() => setMobileOpen(false)}
              />

              {/* Recursos accordion */}
              <MobileAccordion
                label={t("nav.resources")}
                items={resourceItems}
                expanded={mobileExpanded === "resources"}
                onToggle={() =>
                  setMobileExpanded((prev) =>
                    prev === "resources" ? null : "resources"
                  )
                }
                onNavigate={() => setMobileOpen(false)}
              />

              {/* Direct links */}
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="text-[11px] tracking-[0.2em] uppercase text-[var(--mk-text-secondary)] hover:text-[var(--mk-accent)] transition-colors duration-200 py-2"
              >
                {t("nav.pricing")}
              </Link>
              <Link
                href="/nosotros"
                onClick={() => setMobileOpen(false)}
                className="text-[11px] tracking-[0.2em] uppercase text-[var(--mk-text-secondary)] hover:text-[var(--mk-accent)] transition-colors duration-200 py-2"
              >
                {t("nav.about")}
              </Link>

              {/* Login */}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-[11px] tracking-[0.2em] uppercase text-[var(--mk-text-secondary)] hover:text-[var(--mk-accent)] transition-colors duration-200 pt-2 border-t border-[var(--mk-border-rule)]"
              >
                {t("nav.login")}
              </Link>
              <div className="pt-2 border-t border-[var(--mk-border-rule)]">
                <LanguageToggle compact />
              </div>

              {/* Mobile CTA */}
              <button
                onClick={() => { setMobileOpen(false); openBooking(); }}
                className="btn-mk-primary w-full text-[10px] py-3 mt-3 inline-flex items-center justify-center gap-2"
              >
                {t("nav.bookCall")}
                <ArrowRight size={12} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ── Desktop Dropdown Panel ── */
function DropdownPanel({ items }: { items: DropdownItem[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute top-full left-1/2 -translate-x-1/2 pt-3"
      style={{ width: 280 }}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "rgba(20, 20, 20, 0.97)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(24px)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        <div className="p-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-150 group"
              >
                <div
                  className="p-1.5 rounded-md shrink-0 mt-0.5"
                  style={{
                    backgroundColor: "rgba(184,151,58,0.1)",
                    border: "1px solid rgba(184,151,58,0.15)",
                  }}
                >
                  <Icon
                    size={14}
                    strokeWidth={2}
                    style={{ color: "#b8973a" }}
                  />
                </div>
                <div>
                  <div
                    className="text-[11px] font-semibold tracking-[0.1em] uppercase group-hover:text-[var(--mk-accent)] transition-colors duration-150"
                    style={{ color: "rgba(244,240,232,0.85)" }}
                  >
                    {item.label}
                  </div>
                  <div
                    className="text-[10px] leading-[1.5] mt-0.5"
                    style={{ color: "rgba(244,240,232,0.35)" }}
                  >
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Mobile Accordion ── */
function MobileAccordion({
  label,
  items,
  expanded,
  onToggle,
  onNavigate,
}: {
  label: string;
  items: DropdownItem[];
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-[11px] tracking-[0.2em] uppercase text-[var(--mk-text-secondary)] hover:text-[var(--mk-accent)] transition-colors duration-200 py-2"
      >
        {label}
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 pb-2 flex flex-col gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 py-2 text-[11px] tracking-[0.12em] text-[rgba(244,240,232,0.45)] hover:text-[var(--mk-accent)] transition-colors duration-150"
                  >
                    <Icon size={13} strokeWidth={2} style={{ color: "#b8973a", opacity: 0.6 }} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
