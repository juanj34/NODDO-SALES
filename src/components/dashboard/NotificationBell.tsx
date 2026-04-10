"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, UserPlus, Megaphone, FileText, Check, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/i18n";

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bg: string }
> = {
  "lead.new": {
    icon: UserPlus,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  "project.published": {
    icon: Megaphone,
    color: "text-[var(--site-primary)]",
    bg: "bg-[rgba(184,151,58,0.10)]",
  },
  "cotizacion.sent": {
    icon: FileText,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
};

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "es" ? "ahora" : "now";
  if (mins < 60)
    return locale === "es" ? `hace ${mins}m` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)
    return locale === "es" ? `hace ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === "es" ? `hace ${days}d` : `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllRead } =
    useNotifications();
  const { t, locale } = useTranslation("dashboard");

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
        className="relative w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-white hover:border-[var(--border-default)] transition-all cursor-pointer"
        aria-label={t("notifications.title")}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--site-primary)] flex items-center justify-center">
            <span className="font-ui text-[8px] font-bold text-black">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
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
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <span className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {t("notifications.title")}
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-[9px] font-ui uppercase tracking-wider text-[var(--site-primary)] hover:text-white transition-colors cursor-pointer"
                  >
                    {t("notifications.markAllRead")}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell
                    size={24}
                    className="text-[var(--text-muted)] mx-auto mb-2"
                    strokeWidth={1}
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("notifications.empty")}
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const config = TYPE_CONFIG[notif.type] || {
                    icon: Bell,
                    color: "text-[var(--text-tertiary)]",
                    bg: "bg-white/5",
                  };
                  const Icon = config.icon;
                  const title =
                    locale === "en" && notif.title_en
                      ? notif.title_en
                      : notif.title;
                  const body =
                    locale === "en" && notif.body_en
                      ? notif.body_en
                      : notif.body;

                  return (
                    <button
                      key={notif.id}
                      onClick={() => {
                        if (!notif.read) markAsRead(notif.id);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-white/3 transition-colors cursor-pointer ${
                        !notif.read ? "bg-[rgba(184,151,58,0.03)]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}
                        >
                          <Icon size={13} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-white font-medium truncate">
                              {title}
                            </p>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--site-primary)] shrink-0" />
                            )}
                          </div>
                          {body && (
                            <p className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">
                              {body}
                            </p>
                          )}
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                            {timeAgo(notif.created_at, locale)}
                          </p>
                        </div>
                        {notif.read && (
                          <Check
                            size={11}
                            className="text-[var(--text-muted)] shrink-0 mt-1"
                          />
                        )}
                      </div>
                    </button>
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
