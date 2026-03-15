"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Tag,
  Calendar,
  Globe,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "./LeadStatusBadge";
import { LeadCotizacionCard } from "./LeadCotizacionCard";
import type { LeadWithMeta, LeadCotizacionSummary } from "@/types";

interface Props {
  leadId: string;
  lead: LeadWithMeta | undefined;
  onClose: () => void;
  onStatusChange: (leadId: string, newStatus: string) => void;
  updatingStatus: string | null;
  locale: string;
}

export function LeadDetailPanel({
  leadId,
  lead,
  onClose,
  onStatusChange,
  updatingStatus,
  locale,
}: Props) {
  const [cotizaciones, setCotizaciones] = useState<LeadCotizacionSummary[]>([]);
  const [loadingCotiz, setLoadingCotiz] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchCotizaciones() {
      setLoadingCotiz(true);
      try {
        const res = await fetch(`/api/leads/${leadId}/cotizaciones`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCotizaciones(data);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingCotiz(false);
      }
    }
    fetchCotizaciones();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  const copyPhone = async () => {
    if (!lead?.telefono) return;
    await navigator.clipboard.writeText(lead.telefono);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale === "es" ? "es-CO" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString(locale === "es" ? "es-CO" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!lead) return null;

  const whatsappUrl = lead.telefono
    ? `https://wa.me/${lead.telefono.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <motion.div
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className={cn(
        "fixed z-30 bg-[var(--surface-1)] border-l border-[var(--border-subtle)] shadow-2xl overflow-y-auto",
        "inset-0 lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[420px]"
      )}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--surface-1)] border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Back button (mobile) */}
          <button
            onClick={onClose}
            className="lg:hidden text-[var(--text-muted)] hover:text-white transition-colors p-1 -ml-1"
          >
            <ArrowLeft size={18} />
          </button>

          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: `linear-gradient(135deg, rgba(var(--site-primary-rgb), 0.3), rgba(var(--site-primary-rgb), 0.1))`,
              boxShadow: `0 0 0 1.5px rgba(var(--site-primary-rgb), 0.3)`,
              color: "var(--site-primary)",
            }}
          >
            {lead.nombre.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-lg font-light text-white truncate">
              {lead.nombre}
            </h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              {formatDate(lead.created_at)} · {formatTime(lead.created_at)}
            </p>
          </div>

          {/* Close button (desktop) */}
          <button
            onClick={onClose}
            className="hidden lg:flex text-[var(--text-muted)] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Quick Actions */}
        <div className="flex gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500/15 transition-colors"
            >
              <Phone size={13} />
              WhatsApp
            </a>
          )}
          <a
            href={`mailto:${lead.email}`}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-wider hover:text-white hover:border-[var(--border-default)] transition-colors"
          >
            <Mail size={13} />
            Email
          </a>
          {lead.telefono && (
            <button
              onClick={copyPhone}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-wider hover:text-white hover:border-[var(--border-default)] transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          )}
        </div>

        {/* Status Selector */}
        <div>
          <label className="block font-ui text-[10px] text-[var(--text-muted)] mb-2 tracking-wider uppercase font-bold">
            Status
          </label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const isActive = lead.status === key;
              const isUpdating = updatingStatus === lead.id;
              return (
                <button
                  key={key}
                  onClick={() => !isActive && onStatusChange(lead.id, key)}
                  disabled={isUpdating}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                    isActive
                      ? cfg.bg
                      : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]",
                    "disabled:opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isActive ? cfg.dot : "bg-[var(--text-muted)]"
                    )}
                  />
                  {locale === "es" ? cfg.label : cfg.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cotizaciones Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={13} className="text-[var(--text-muted)]" />
            <span className="font-ui text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-bold">
              {locale === "es" ? "Cotizaciones" : "Quotations"}
              {!loadingCotiz && ` (${cotizaciones.length})`}
            </span>
          </div>

          {loadingCotiz ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={18} className="animate-spin text-[var(--text-muted)]" />
            </div>
          ) : cotizaciones.length === 0 ? (
            <p className="text-[12px] text-[var(--text-muted)] py-3 text-center">
              {locale === "es" ? "Sin cotizaciones" : "No quotations"}
            </p>
          ) : (
            <div className="space-y-2">
              {cotizaciones.map((c) => (
                <LeadCotizacionCard key={c.id} cotizacion={c} locale={locale} />
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--border-subtle)]" />

        {/* Contact Details */}
        <div className="space-y-2.5">
          <span className="font-ui text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-bold">
            {locale === "es" ? "Detalles" : "Details"}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <DetailRow icon={<Mail size={13} />} label="Email" value={lead.email} />
            <DetailRow
              icon={<Phone size={13} />}
              label={locale === "es" ? "Teléfono" : "Phone"}
              value={lead.telefono}
            />
            <DetailRow
              icon={<MapPin size={13} />}
              label={locale === "es" ? "País" : "Country"}
              value={lead.pais}
            />
            <DetailRow
              icon={<Tag size={13} />}
              label={locale === "es" ? "Tipología" : "Typology"}
              value={lead.tipologia_interes}
            />
            <DetailRow
              icon={<Calendar size={13} />}
              label={locale === "es" ? "Registro" : "Registered"}
              value={formatDate(lead.created_at)}
            />
            {lead.proyecto_nombre && (
              <DetailRow
                icon={<Globe size={13} />}
                label={locale === "es" ? "Proyecto" : "Project"}
                value={lead.proyecto_nombre}
              />
            )}
          </div>

          {/* UTM Info */}
          {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
            <div className="pt-1">
              <span className="font-ui text-[9px] text-[var(--text-muted)] tracking-wider uppercase font-bold">
                {locale === "es" ? "Fuente" : "Source"}
              </span>
              <div className="flex gap-2 mt-1 flex-wrap">
                {lead.utm_source && (
                  <span className="px-2 py-0.5 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded text-[10px] text-[var(--text-secondary)]">
                    {lead.utm_source}
                  </span>
                )}
                {lead.utm_medium && (
                  <span className="px-2 py-0.5 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded text-[10px] text-[var(--text-secondary)]">
                    {lead.utm_medium}
                  </span>
                )}
                {lead.utm_campaign && (
                  <span className="px-2 py-0.5 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded text-[10px] text-[var(--text-secondary)]">
                    {lead.utm_campaign}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        {lead.mensaje && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare size={13} className="text-[var(--text-muted)]" />
              <span className="font-ui text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-bold">
                {locale === "es" ? "Mensaje" : "Message"}
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border-subtle)] whitespace-pre-wrap">
              {lead.mensaje}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-2 p-2.5 bg-[var(--surface-2)] rounded-xl border border-[var(--border-subtle)]">
      <span className="text-[var(--text-muted)] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-ui text-[9px] text-[var(--text-muted)] tracking-wider uppercase font-bold">
          {label}
        </p>
        <p className="text-sm text-[var(--text-secondary)] truncate">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
