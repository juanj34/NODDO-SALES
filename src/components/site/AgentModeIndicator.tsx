"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, LogOut } from "lucide-react";
import { useAgentMode } from "@/hooks/useAgentMode";

export function AgentModeIndicator() {
  const { isAgentMode, agentUser, logout } = useAgentMode();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isAgentMode || !agentUser) return null;

  const displayName =
    agentUser.nombre
      ? `${agentUser.nombre}${agentUser.apellido ? ` ${agentUser.apellido}` : ""}`
      : agentUser.email;

  return (
    <div className="fixed bottom-4 left-4 z-[150]">
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(var(--site-primary-rgb),0.3)] bg-[#111113]/90 backdrop-blur-xl shadow-lg hover:border-[rgba(var(--site-primary-rgb),0.5)] transition-colors cursor-pointer"
      >
        <Shield size={14} className="text-[var(--site-primary)]" />
        <span className="text-xs font-mono text-white/70 max-w-[120px] truncate">
          {displayName}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--site-primary)] animate-pulse" />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-white/10 bg-[#111113]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-[10px] font-ui uppercase tracking-[0.12em] text-[var(--site-primary)]">
                Modo Agente
              </p>
              <p className="text-xs font-mono text-white/50 truncate mt-0.5">
                {agentUser.email}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-mono text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
