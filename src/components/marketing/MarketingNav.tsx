"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { LogIn, ArrowRight } from "lucide-react";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useBooking } from "./BookingProvider";
import { useTranslation } from "@/i18n";

interface NavLink {
  label: string;
  href?: string;
  action?: "booking";
}

export function MarketingNav() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openBooking } = useBooking();
  const { t } = useTranslation("marketing");

  const navLinks: NavLink[] = [
    { label: t("nav.product"), href: "#capacidades" },
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.contact"), action: "booking" },
  ];

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    if (currentY < 80) {
      setVisible(true);
    } else if (currentY > lastScrollY) {
      setVisible(false);
      setMobileOpen(false);
    } else {
      setVisible(true);
    }
    setLastScrollY(currentY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleNavAction = (link: NavLink) => {
    if (link.action === "booking") {
      setMobileOpen(false);
      openBooking();
    }
  };

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
        {/* Logo: NOD<gold>DO</gold> */}
        <Link href="/" aria-label="NODDO Home">
          <NodDoLogo height={18} />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <li key={link.label}>
              {link.action ? (
                <button
                  onClick={() => handleNavAction(link)}
                  className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[rgba(244,240,232,0.4)] hover:text-[var(--mk-accent)] transition-colors duration-200"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  href={link.href!}
                  className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[rgba(244,240,232,0.4)] hover:text-[var(--mk-accent)] transition-colors duration-200"
                >
                  {link.label}
                </Link>
              )}
            </li>
          ))}
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
            className="btn-mk-primary text-[10px] py-2.5 px-5 inline-flex items-center gap-2"
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
            <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) =>
                link.action ? (
                  <button
                    key={link.label}
                    onClick={() => handleNavAction(link)}
                    className="text-left text-[11px] tracking-[0.2em] uppercase text-[var(--mk-text-secondary)] hover:text-[var(--mk-accent)] transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href!}
                    onClick={() => setMobileOpen(false)}
                    className="text-[11px] tracking-[0.2em] uppercase text-[var(--mk-text-secondary)] hover:text-[var(--mk-accent)] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                )
              )}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
