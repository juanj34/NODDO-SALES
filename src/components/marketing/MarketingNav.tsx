"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { NodDoLogo } from "@/components/ui/NodDoLogo";

const navLinks = [
  { label: "Producto", href: "#capacidades" },
  { label: "Precios", href: "/pricing" },
  { label: "Casos", href: "/sites/alto-de-yeguas" },
  { label: "Contacto", href: "mailto:hola@noddo.co" },
];

export function MarketingNav() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <nav className="mx-auto max-w-7xl px-6 lg:px-20 py-6 flex items-center justify-between">
        {/* Logo: NOD<gold>DO</gold> */}
        <Link href="/" aria-label="NODDO Home">
          <NodDoLogo height={18} />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-[10px] tracking-[0.2em] uppercase text-[rgba(244,240,232,0.4)] hover:text-[var(--mk-accent)] transition-colors duration-200"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="btn-mk-primary text-[10px] py-2.5 px-5">
            Demo gratis
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden flex flex-col gap-1.5 p-2"
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
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[11px] tracking-[0.2em] uppercase text-[var(--mk-text-secondary)] hover:text-[var(--mk-accent)] transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
