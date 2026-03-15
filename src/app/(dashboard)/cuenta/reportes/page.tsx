"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { pageTitle, pageDescription, sectionCard } from "@/components/dashboard/editor-styles";
import { Mail, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { EmailReportConfig } from "@/types";

export default function ReportesPage() {
  const [config, setConfig] = useState<EmailReportConfig>({
    weekly_enabled: true,
    monthly_enabled: true,
    project_ids: null,
    email_override: null,
    timezone: "America/Bogota",
    last_weekly_sent: null,
    last_monthly_sent: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user/email-reports")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load email report config:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/user/email-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save email report config:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={24} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className={pageTitle}>Reportes por Email</h1>
        <p className={pageDescription}>
          Recibe reportes automáticos de analytics y ventas en tu email
        </p>
      </div>

      <div className={sectionCard}>
        <div className="space-y-6">
          {/* Weekly Report */}
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={config.weekly_enabled}
              onChange={(e) => setConfig({ ...config, weekly_enabled: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-[var(--border-default)] bg-[var(--surface-3)] checked:bg-[var(--site-primary)] cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[var(--site-primary)]" />
                <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                  Reporte Semanal
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Recibe un resumen cada lunes con analytics y ventas de la última semana
              </p>
              {config.last_weekly_sent && (
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Último envío: {new Date(config.last_weekly_sent).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </label>

          {/* Monthly Report */}
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={config.monthly_enabled}
              onChange={(e) => setConfig({ ...config, monthly_enabled: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-[var(--border-default)] bg-[var(--surface-3)] checked:bg-[var(--site-primary)] cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[var(--site-primary)]" />
                <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                  Reporte Mensual
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Recibe un resumen completo el primer día de cada mes
              </p>
              {config.last_monthly_sent && (
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Último envío: {new Date(config.last_monthly_sent).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </label>

          {/* Save Button */}
          <div className="pt-4 border-t border-[var(--border-subtle)]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-warm relative"
            >
              {saving && <Loader2 className="animate-spin mr-2" size={16} />}
              {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
