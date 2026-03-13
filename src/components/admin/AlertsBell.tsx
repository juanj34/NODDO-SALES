"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, AlertTriangle, Info, AlertCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { PlatformAlert } from "@/types";

const SEVERITY_CONFIG = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  critical: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
};

export function AlertsBell() {
  const [alerts, setAlerts] = useState<PlatformAlert[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/alerts")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PlatformAlert[]) => setAlerts(data))
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        aria-label="Alertas"
      >
        <Bell size={15} />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <span className="font-ui text-[8px] font-bold text-white">{alerts.length}</span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-12 w-80 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <span className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Alertas
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-[var(--text-muted)]">Sin alertas</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const config = SEVERITY_CONFIG[alert.severity];
                  const Icon = config.icon;
                  return (
                    <div
                      key={alert.id}
                      className={`px-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0 ${config.bg}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-6 h-6 rounded-md ${config.bg} ${config.border} border flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon size={12} className={config.color} />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
