"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useTranslation } from "@/i18n";

interface Props {
  userEmail: string;
  isAdmin: boolean;
  onCreateClick: () => void;
}

function getGreeting(t: (k: string) => string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t("home.greetingMorning");
  if (hour >= 12 && hour < 18) return t("home.greetingAfternoon");
  return t("home.greetingEvening");
}

function formatDate(): string {
  return new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function extractName(email: string): string {
  const local = email.split("@")[0];
  // Capitalize first letter
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function DashboardGreeting({ userEmail, isAdmin, onCreateClick }: Props) {
  const { t } = useTranslation("dashboard");
  const greeting = getGreeting(t);
  const name = extractName(userEmail);
  const date = formatDate();

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Ambient gold glow */}
      <div
        className="absolute -top-16 -left-16 w-[500px] h-[200px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 500px 180px at 30% 60%, rgba(184,151,58,0.06), transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <h1 className="font-heading text-[28px] sm:text-[32px] font-light text-[var(--text-primary)] leading-tight">
          {greeting}, {name}
        </h1>
        <p className="font-mono text-xs text-[var(--text-tertiary)] mt-1 capitalize">
          {date}
        </p>
      </motion.div>

      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10"
        >
          <MagneticButton>
            <button
              onClick={onCreateClick}
              className="btn-noddo flex items-center gap-2 px-5 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em]"
            >
              <Plus size={16} />
              {t("proyectos.newProject")}
            </button>
          </MagneticButton>
        </motion.div>
      )}
    </div>
  );
}
