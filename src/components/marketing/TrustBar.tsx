"use client";

import { motion } from "framer-motion";
import { InfiniteSlider } from "@/components/ui/infinite-slider";

const logos = [
  { name: "Constructora Bolívar", initials: "CB" },
  { name: "Amarilo", initials: "AM" },
  { name: "Marval", initials: "MV" },
  { name: "Prodesa", initials: "PD" },
  { name: "Cusezar", initials: "CZ" },
  { name: "Ospinas", initials: "OS" },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function TrustBar() {
  return (
    <section className="py-16 lg:py-20 border-t border-[var(--mk-border-rule)] relative z-[1]">
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center text-[9px] tracking-[0.3em] uppercase text-[var(--mk-text-muted)] mb-10"
        >
          Constructoras que confían en Noddo
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1, ease }}
      >
        <InfiniteSlider gap={48} duration={20} durationOnHover={40}>
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center gap-3 shrink-0"
            >
              <div
                className="w-9 h-9 flex items-center justify-center text-[10px] font-ui font-bold tracking-wider"
                style={{
                  background: "rgba(184, 151, 58, 0.06)",
                  border: "1px solid rgba(184, 151, 58, 0.12)",
                  color: "rgba(184, 151, 58, 0.50)",
                }}
              >
                {logo.initials}
              </div>
              <span
                className="text-[11px] font-medium whitespace-nowrap"
                style={{ color: "rgba(244, 240, 232, 0.2)" }}
              >
                {logo.name}
              </span>
            </div>
          ))}
        </InfiniteSlider>
      </motion.div>
    </section>
  );
}
