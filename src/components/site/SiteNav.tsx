"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  Images,
  LayoutGrid,
  MapPin,
  Video,
  FileText,
  Globe,
  Mail,
  Menu,
  X,
} from "lucide-react";

interface SiteNavProps {
  slug: string;
  projectName: string;
}

const navItems = [
  { label: "Inicio", href: "", icon: Home },
  { label: "Galería", href: "/galeria", icon: Images },
  { label: "Tipologías", href: "/tipologias", icon: LayoutGrid },
  { label: "Ubicación", href: "/ubicacion", icon: MapPin },
  { label: "Videos", href: "/videos", icon: Video },
  { label: "Brochure", href: "/brochure", icon: FileText },
  { label: "Tour 360", href: "/tour-360", icon: Globe },
  { label: "Contacto", href: "/contacto", icon: Mail },
];

export function SiteNav({ slug, projectName }: SiteNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const basePath = `/sites/${slug}`;

  return (
    <>
      {/* Mobile/Tablet toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 left-6 z-[60] lg:hidden w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10 rounded"
      >
        {isOpen ? (
          <X size={18} className="text-white" />
        ) : (
          <Menu size={18} className="text-white" />
        )}
      </button>

      {/* Overlay for mobile */}
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
        initial={false}
        animate={{ x: 0 }}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-[55] w-20 flex flex-col items-center py-8 bg-black/40 backdrop-blur-xl border-r border-white/5",
          "lg:translate-x-0 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Project name vertical */}
        <div className="mb-8">
          <span className="text-[var(--site-primary)] text-xs font-semibold tracking-[0.3em] writing-mode-vertical"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            {projectName.toUpperCase()}
          </span>
        </div>

        {/* Nav items */}
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const fullPath = `${basePath}${item.href}`;
            const isActive =
              item.href === ""
                ? pathname === basePath
                : pathname.startsWith(fullPath);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={fullPath}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "relative w-14 h-14 flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-300 group",
                  isActive
                    ? "text-[var(--site-primary)]"
                    : "text-white/40 hover:text-white/80"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-white/5 rounded-lg border border-[var(--site-primary)]/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10 text-[8px] tracking-wider font-medium uppercase">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
