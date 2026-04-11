"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import {
  inputClass,
  labelClass,
  fieldHint,
  sectionCard,
  sectionTitle,
  sectionDescription,
  btnPrimary,
  btnSecondary,
} from "@/components/dashboard/editor-styles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import tooltips from "@/i18n/locales/es/tooltips";
import {
  Webhook,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  Clock,
  Send,
  XCircle,
  RefreshCw,
  KeyRound,
  Zap,
} from "lucide-react";
import type { WebhookConfig, WebhookLog } from "@/types";

export default function IntegracionesTab() {
  const { project } = useEditorProject();
  const toast = useToast();
  const { t } = useTranslation("editor");

  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["lead.created", "cotizacion.created"]);
  const [secret, setSecret] = useState("");
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/proyectos/${project.id}/webhooks`);
      if (res.ok) {
        const config: WebhookConfig | null = await res.json();
        if (config) {
          setEnabled(config.enabled);
          setUrl(config.url);
          setEvents(config.events);
          setSecret(config.secret);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [project]);

  const fetchLogs = useCallback(async () => {
    if (!project) return;
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/proyectos/${project.id}/webhooks/logs?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
      }
    } finally {
      setLogsLoading(false);
    }
  }, [project]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  useEffect(() => {
    if (!loading && enabled) fetchLogs();
  }, [enabled, loading, fetchLogs]);

  const handleSave = async () => {
    if (!project) return;
    if (enabled && !url.trim()) {
      toast.error(t("webhooks.urlRequired"));
      return;
    }
    if (enabled && events.length === 0) {
      toast.error(t("webhooks.selectEvent"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/proyectos/${project.id}/webhooks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, url: url.trim(), events }),
      });
      if (res.ok) {
        const data = await res.json();
        setSecret(data.secret);
        if (data._secret_revealed) {
          setSecretRevealed(true);
          setShowSecret(true);
          toast.success(t("webhooks.configured"));
        } else {
          toast.success(t("webhooks.updated"));
        }
        fetchLogs();
      } else {
        const err = await res.json();
        toast.error(err.error || t("errors.saveError"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!project) return;
    setTesting(true);
    try {
      const res = await fetch(`/api/proyectos/${project.id}/webhooks/test`, { method: "POST" });
      if (res.ok) {
        toast.success(t("webhooks.testSent"));
        setTimeout(() => fetchLogs(), 2000);
      } else {
        const err = await res.json();
        toast.error(err.error || t("errors.saveError"));
      }
    } finally {
      setTesting(false);
    }
  };

  const handleRegenerateSecret = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proyectos/${project.id}/webhooks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, url: url.trim(), events, regenerate_secret: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setSecret(data.secret);
        setSecretRevealed(true);
        setShowSecret(true);
        toast.success(t("webhooks.secretGenerated"));
      } else {
        const err = await res.json();
        toast.error(err.error || t("errors.saveError"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success(t("webhooks.secretCopied"));
  };

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[var(--site-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between">
          <div>
            <div className={sectionTitle}>
              <Zap size={15} className="text-[var(--site-primary)]" />
              {t("webhooks.title")}
            </div>
            <p className={sectionDescription + " !mb-0"}>
              {t("webhooks.hint")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0",
              enabled ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]",
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                enabled ? "translate-x-6" : "translate-x-1",
              )}
            />
          </button>
        </div>
      </div>

      {enabled && (
        <>
          {/* URL */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <Send size={15} className="text-[var(--site-primary)]" />
              {t("webhooks.destinationUrl")}
            </div>
            <p className={sectionDescription}>
              {t("webhooks.signedPostHint")}
            </p>
            <div>
              <label className={`${labelClass} flex items-center gap-2`}>
                {t("webhooks.urlLabel")}
                <InfoTooltip
                  content={tooltips.webhooks.urlWebhook.long}
                  variant="dashboard"
                  placement="auto"
                />
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className={inputClass}
              />
              <p className={fieldHint}>{t("webhooks.urlHint")}</p>
            </div>
          </div>

          {/* Events */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <Webhook size={15} className="text-[var(--site-primary)]" />
              {t("webhooks.events")}
            </div>
            <p className={sectionDescription}>{t("webhooks.eventsHint")}</p>

            <div className="space-y-2">
              {[
                { key: "lead.created", label: "lead.created", desc: t("webhooks.leadCreatedDesc") },
                { key: "cotizacion.created", label: "cotizacion.created", desc: t("webhooks.cotizacionCreatedDesc") },
              ].map((evt) => (
                <label
                  key={evt.key}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-default)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={events.includes(evt.key)}
                    onChange={() => toggleEvent(evt.key)}
                    className="accent-[var(--site-primary)] w-4 h-4 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-xs text-white font-medium font-mono">{evt.label}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{evt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Secret */}
          {secret && (
            <div className={sectionCard}>
              <div className={sectionTitle}>
                <KeyRound size={15} className="text-[var(--site-primary)]" />
                {t("webhooks.secretSignature")}
                <InfoTooltip
                  content={tooltips.webhooks.secretFirma.long}
                  variant="dashboard"
                  placement="auto"
                />
              </div>
              <p className={sectionDescription}>
                {t("webhooks.secretHint")}
              </p>

              {secretRevealed && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                  <p className="text-xs text-amber-300 font-medium">
                    {t("webhooks.secretWarning")}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={secret}
                    readOnly
                    className={cn(inputClass, "pr-10 font-mono text-xs")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button type="button" onClick={handleCopySecret} className={btnSecondary + " shrink-0"}>
                  <Copy size={13} />
                  {t("webhooks.copy")}
                </button>
              </div>

              <button
                type="button"
                onClick={handleRegenerateSecret}
                disabled={saving}
                className="mt-3 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {t("webhooks.regenerateSecret")}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || events.length === 0}
              className={btnPrimary}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {saving ? t("webhooks.saving") : t("webhooks.save")}
            </button>

            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !secret}
              className={btnSecondary}
            >
              {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {testing ? t("webhooks.sending") : t("webhooks.sendTest")}
            </button>
          </div>

          {/* Logs */}
          <div className={sectionCard}>
            <div className="flex items-center justify-between mb-4">
              <div className={sectionTitle + " !mb-0"}>
                <Clock size={15} className="text-[var(--site-primary)]" />
                {t("webhooks.deliveryHistory")}
              </div>
              <button
                type="button"
                onClick={fetchLogs}
                disabled={logsLoading}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <RefreshCw size={13} className={cn(logsLoading && "animate-spin")} />
              </button>
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-[var(--text-muted)]" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-[var(--text-muted)]">
                  {t("webhooks.noDeliveries")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {log.delivered ? (
                            <CheckCircle size={13} className="text-green-400 shrink-0" />
                          ) : (
                            <XCircle size={13} className="text-red-400 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-white font-mono">
                            {log.event_type}
                          </span>
                          {log.status_code && (
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                log.delivered
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400",
                              )}
                            >
                              {log.status_code}
                            </span>
                          )}
                        </div>
                        {log.error && (
                          <div className="text-[10px] text-red-400 mt-1">{log.error}</div>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {new Date(log.created_at).toLocaleString("es", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
