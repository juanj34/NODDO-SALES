"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Loader2,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  X,
  TrendingUp,
  Users,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import {
  GHL_BOOKING_URL,
  SUPABASE_FN_URL,
  GHL_CALENDAR_TZ,
  SESSION_MINUTES,
  MAX_DISPLAY_SLOTS,
  NODDO_WA_URL,
  COUNTRY_CODES,
  MONTH_NAMES_ES,
  MONTH_NAMES_EN,
  calendarTzToLocal,
  todayInCalendarTz,
  getGmtLabel,
  formatDateLong,
  BOOKING_HOST,
} from "@/lib/booking-constants";
import {
  trackBookingOpened,
  trackBookingDateSelected,
  trackBookingTimeSelected,
  trackBookingConfirmed,
} from "@/lib/marketing-tracking";

// ─── Types ──────────────────────────────────────────────────────────────

export interface BookingFlowProps {
  onClose?: () => void;
}

type Step =
  | "loading"
  | "calendar"
  | "timeslots"
  | "confirm"
  | "booking"
  | "success"
  | "fallback";

type LocalSlot = { localTime: string; calDate: string; calTime: string };
type LocalSlotsData = Record<string, LocalSlot[]>;

// ─── Host Avatar (photo) ────────────────────────────────────────────────

const HostAvatar = ({ size = 56, className = "" }: { size?: number; className?: string }) => (
  <div
    className={`rounded-full border-2 border-[rgba(184,151,58,0.4)] overflow-hidden shrink-0 ${className}`}
    style={{ width: size, height: size }}
  >
    <Image
      src={BOOKING_HOST.photo}
      alt={BOOKING_HOST.name}
      width={size}
      height={size}
      className="object-cover w-full h-full"
    />
  </div>
);

// ─── Custom SVG Icons for badges ────────────────────────────────────────

const IconAnalysis = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 21l-4.35-4.35" />
    <circle cx="11" cy="11" r="8" />
    <path d="M8 11h6M11 8v6" />
  </svg>
);

const IconDemo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
    <path d="M10 9l4 2-4 2V9z" fill="currentColor" stroke="none" />
  </svg>
);

const IconPricing = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M4 12h16M4 17h10" />
    <circle cx="19" cy="17" r="2.5" />
    <path d="M19 15.5v-1M19 19.5v1" />
  </svg>
);

// ─── Host Card ──────────────────────────────────────────────────────────

const HostCard = () => {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col items-center pt-3 pb-4">
      {/* NODDO logo */}
      <NodDoLogo width={72} colorNod="rgba(244,240,232,.35)" colorDo="#b8983c" />

      {/* Avatar with glow ring */}
      <div className="relative mt-3 mb-3">
        <div className="absolute -inset-2 rounded-full bg-[rgba(184,151,58,0.08)] blur-lg" />
        <HostAvatar size={64} className="relative border-[rgba(184,151,58,0.5)]" />
      </div>

      {/* Session title with advisor name */}
      <p className="font-heading text-lg font-light text-[var(--mk-text-primary)] mb-0.5">
        {t("booking.sessionWith")} {BOOKING_HOST.name.split(" ")[0]}
      </p>

      {/* Subtitle */}
      <p className="text-[11px] text-[var(--mk-text-tertiary)]">
        {t("booking.sessionSub")}
      </p>
    </div>
  );
};

// ─── Call Badges (what happens in the call) ─────────────────────────────

const CallBadges = () => {
  const { t } = useTranslation("common");
  const badges = [
    { Icon: IconAnalysis, label: t("booking.badgeAnalysis") },
    { Icon: IconDemo, label: t("booking.badgeDemo") },
    { Icon: IconPricing, label: t("booking.badgePricing") },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
      {badges.map(({ Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 text-[10px] text-[var(--mk-text-secondary)] bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5"
        >
          <span className="text-[var(--mk-accent)]"><Icon /></span>
          {label}
        </span>
      ))}
    </div>
  );
};

// ─── Booking Insight ────────────────────────────────────────────────────

const BOOKING_INSIGHTS = [
  {
    Icon: TrendingUp,
    stat: "47%",
    text: "Los equipos con showroom digital cierran ventas un 47% más rápido",
  },
  {
    Icon: Users,
    stat: "2.4×",
    text: "Los asesores que usan NODDO generan 2.4× más leads cualificados",
  },
  {
    Icon: Sparkles,
    stat: "100+",
    text: "Desarrolladores inmobiliarios ya usan NODDO para vender mejor",
  },
];

const BookingInsight = ({ index }: { index: number }) => {
  const insight = BOOKING_INSIGHTS[index % BOOKING_INSIGHTS.length];
  const Icon = insight.Icon;
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3 mt-4"
      style={{
        background: "rgba(184,151,58,0.06)",
        border: "1px solid rgba(184,151,58,0.12)",
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(184,151,58,0.12)" }}
      >
        <Icon size={14} className="text-[#b8973a]" />
      </div>
      <div className="min-w-0">
        <span className="font-heading text-base font-light text-[#b8973a]">
          {insight.stat}
        </span>
        <p className="text-[10px] leading-relaxed mt-0.5 text-white/35">
          {insight.text}
        </p>
      </div>
    </div>
  );
};

// ─── Host Mini Card (timeslots & confirm) ───────────────────────────────

const HostMiniCard = () => {
  const { t } = useTranslation("common");
  return (
    <div className="glass-booking rounded-xl p-3 mb-4 flex items-center gap-3">
      <HostAvatar size={32} className="!border" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-white truncate">
          {t("booking.sessionWith")} {BOOKING_HOST.name.split(" ")[0]}
        </p>
        <p className="text-[10px] text-[var(--mk-text-tertiary)]">
          {t("booking.sessionSub")}
        </p>
      </div>
      <span className="font-ui text-[9px] font-bold uppercase tracking-wider text-[var(--mk-accent)] bg-[rgba(184,151,58,0.1)] border border-[rgba(184,151,58,0.15)] rounded-md px-2 py-1 shrink-0">
        {t("booking.duration")}
      </span>
    </div>
  );
};

// ─── Step Indicator ─────────────────────────────────────────────────────

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const { t } = useTranslation("common");
  const steps = [
    t("booking.stepDate"),
    t("booking.stepTime"),
    t("booking.stepConfirm"),
  ];

  return (
    <div className="flex items-center justify-center mb-5">
      {steps.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-10 h-px ${
                  done ? "bg-[var(--mk-accent)]" : "bg-white/[0.08]"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                  done
                    ? "bg-[var(--mk-accent)] text-black"
                    : active
                    ? "border border-[var(--mk-accent)] text-[var(--mk-accent)] shadow-[0_0_8px_rgba(184,151,58,0.3)]"
                    : "bg-white/[0.06] text-white/25"
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={`font-ui text-[9px] font-bold uppercase tracking-[0.12em] ${
                  active
                    ? "text-[var(--mk-accent)]"
                    : done
                    ? "text-white/50"
                    : "text-white/25"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Day Pill Grid ──────────────────────────────────────────────────────

const DayPillGrid = ({
  dates,
  selected,
  onSelect,
}: {
  dates: string[];
  selected: string;
  onSelect: (d: string) => void;
}) => {
  const { t, locale } = useTranslation("common");
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const totalPages = Math.ceil(dates.length / pageSize);
  const pageDates = dates.slice(page * pageSize, (page + 1) * pageSize);

  const firstDate = pageDates[0]
    ? new Date(pageDates[0] + "T00:00:00")
    : new Date();
  const monthNames = locale === "en" ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const monthLabel = `${monthNames[firstDate.getMonth()]} ${firstDate.getFullYear()}`;

  const dayNames = [
    t("booking.daySun"),
    t("booking.dayMon"),
    t("booking.dayTue"),
    t("booking.dayWed"),
    t("booking.dayThu"),
    t("booking.dayFri"),
    t("booking.daySat"),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-white/60">{monthLabel}</p>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-1 rounded-md hover:bg-white/10 disabled:opacity-20 text-white/60"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 rounded-md hover:bg-white/10 disabled:opacity-20 text-white/60"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
        {pageDates.map((dateStr) => {
          const d = new Date(dateStr + "T00:00:00");
          const dayName = dayNames[d.getDay()];
          const dayNum = d.getDate();
          const isSelected = dateStr === selected;

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`relative rounded-xl py-3 px-1 text-center transition-all ${
                isSelected
                  ? "border-2 border-[var(--mk-accent)] bg-[rgba(184,151,58,0.1)] shadow-[0_0_15px_rgba(184,151,58,0.2)]"
                  : "glass-booking hover:border-[rgba(184,151,58,0.3)]"
              }`}
            >
              <p
                className={`font-ui text-[10px] font-bold uppercase ${
                  isSelected ? "text-[var(--mk-accent)]" : "text-white/40"
                }`}
              >
                {dayName}
              </p>
              <p
                className={`text-lg font-black leading-tight ${
                  isSelected ? "text-white" : "text-white/70"
                }`}
              >
                {dayNum}
              </p>
              <p className="text-[8px] text-green-400/60 mt-0.5">&bull;</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Fallback View ──────────────────────────────────────────────────────

const FallbackView = ({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation("common");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Header */}
      {onClose && (
        <div className="bg-[#1a1a1a] border-b border-[rgba(184,151,58,0.15)] px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="flex-1">
            <h3 className="font-ui text-sm font-bold text-[var(--mk-text-primary)] uppercase tracking-wide">
              {t("booking.fallbackTitle")}
            </h3>
            <p className="text-[10px] text-[var(--mk-text-tertiary)]">
              {t("booking.fallbackSub")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[var(--mk-text-tertiary)] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="relative flex-1 min-h-[500px] sm:min-h-[580px]">
        {!iframeLoaded && !timedOut && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="w-8 h-8 text-[var(--mk-accent)] animate-spin" />
            <p className="text-xs text-[var(--mk-text-tertiary)]">
              {t("booking.fallbackLoading")}
            </p>
          </div>
        )}

        {timedOut && !iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 px-6">
            <p className="text-sm text-white font-bold text-center">
              {t("booking.fallbackProblem")}
            </p>
            <p className="text-xs text-[var(--mk-text-tertiary)] text-center max-w-sm">
              {t("booking.fallbackDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <a
                href={GHL_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl btn-mk-primary text-xs flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t("booking.fallbackOpen")}
              </a>
              <a
                href={NODDO_WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl border border-green-500/30 text-green-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-500/10 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </div>
          </div>
        )}

        <iframe
          src={GHL_BOOKING_URL}
          className="w-full h-full min-h-[500px] sm:min-h-[580px]"
          style={{
            border: "none",
            opacity: iframeLoaded ? 1 : 0,
            transition: "opacity 0.3s",
          }}
          onLoad={() => setIframeLoaded(true)}
          title={t("booking.fallbackTitle")}
        />
      </div>

      {/* Footer */}
      <div className="bg-[#1a1a1a] border-t border-[rgba(184,151,58,0.15)] px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[rgba(184,151,58,0.5)]" />
          <p className="text-[10px] text-[var(--mk-text-tertiary)]">
            {t("booking.fallbackFooter")}
          </p>
        </div>
        <a
          href={NODDO_WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] text-[var(--mk-text-tertiary)] hover:text-[var(--mk-accent)] transition-colors"
        >
          <MessageCircle className="w-3 h-3" />
          WhatsApp
        </a>
      </div>
    </>
  );
};

// ─── Modal Header ───────────────────────────────────────────────────────

const ModalHeader = ({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack?: () => void;
}) => {
  const { t } = useTranslation("common");
  return (
    <div className="bg-[#1a1a1a] border-b border-[rgba(184,151,58,0.15)] px-4 py-3 flex items-center gap-2 shrink-0">
      {onBack && (
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[var(--mk-text-tertiary)] hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <Image src="/LOGO_FAVICON-GOL.svg" alt="NODDO" width={18} height={18} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="font-ui text-sm font-bold text-[var(--mk-text-primary)] uppercase tracking-wide">
          {t("booking.agendaHeader")}
        </h3>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[var(--mk-text-tertiary)] hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── Main BookingFlow Component ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const BookingFlow = ({ onClose }: BookingFlowProps) => {
  const { t, locale } = useTranslation("common");
  const [step, setStep] = useState<Step>("loading");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCountryCode, setFormCountryCode] = useState("+57");
  const [wantWA, setWantWA] = useState(true);
  const [bookingError, setBookingError] = useState("");
  const [localSlots, setLocalSlots] = useState<LocalSlotsData>({});
  const [selectedCal, setSelectedCal] = useState({ date: "", time: "" });

  const clientTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return GHL_CALENDAR_TZ;
    }
  }, []);

  // ── Fetch slots on mount ──
  useEffect(() => {
    if (step !== "loading") return;

    const fetchSlots = async () => {
      try {
        const calNow = todayInCalendarTz();
        const calToday = new Date(calNow + "T12:00:00");
        const start = new Date(calToday);
        start.setDate(start.getDate() + 1);
        const end = new Date(start);
        end.setDate(end.getDate() + 13);

        const fmtCal = new Intl.DateTimeFormat("en-CA", {
          timeZone: GHL_CALENDAR_TZ,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const startStr = fmtCal.format(start);
        const endStr = fmtCal.format(end);

        const res = await fetch(
          `${SUPABASE_FN_URL}/ghl-slots?startDate=${startStr}&endDate=${endStr}`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
            },
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const validSlots: Record<string, string[]> = {};
        for (const [date, times] of Object.entries(data.slots || {})) {
          if (Array.isArray(times) && times.length > 0) {
            const sorted = [...(times as string[])].sort();
            validSlots[date] = sorted.slice(0, MAX_DISPLAY_SLOTS);
          }
        }

        if (Object.keys(validSlots).length === 0) {
          setStep("fallback");
          return;
        }

        // Convert calendar TZ slots to client's local timezone
        const local: LocalSlotsData = {};
        for (const [cDate, times] of Object.entries(validSlots)) {
          for (const cTime of times) {
            const { localDate, localTime } = calendarTzToLocal(
              cDate,
              cTime,
              clientTz
            );
            if (!local[localDate]) local[localDate] = [];
            local[localDate].push({
              localTime,
              calDate: cDate,
              calTime: cTime,
            });
          }
        }
        for (const arr of Object.values(local)) {
          arr.sort((a, b) => a.localTime.localeCompare(b.localTime));
        }

        setLocalSlots(local);
        setStep("calendar");
        trackBookingOpened();
      } catch (err) {
        console.error("[BookingFlow] Failed to fetch slots:", err);
        setStep("fallback");
      }
    };

    fetchSlots();
  }, [step, clientTz]);

  const availableDates = Object.keys(localSlots).sort();

  // ── Handle booking submission ──
  const handleBook = useCallback(async () => {
    if (!selectedCal.date || !selectedCal.time || !formEmail) return;

    setStep("booking");
    setBookingError("");

    try {
      const calOffset = getCalendarOffset(selectedCal.date, selectedCal.time);
      const startTime = `${selectedCal.date}T${selectedCal.time}:00${calOffset}`;
      const startInstant = new Date(startTime);
      const endInstant = new Date(
        startInstant.getTime() + SESSION_MINUTES * 60_000
      );

      const endDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: GHL_CALENDAR_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(endInstant);
      const endTimeStr = new Intl.DateTimeFormat("en-GB", {
        timeZone: GHL_CALENDAR_TZ,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(endInstant);
      const endTime = `${endDateStr}T${endTimeStr}:00${calOffset}`;

      // Gather UTM params + visitor context for attribution
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get("utm_source") || undefined;
      const utmMedium = urlParams.get("utm_medium") || undefined;
      const utmCampaign = urlParams.get("utm_campaign") || undefined;
      const referrer = document.referrer || undefined;
      let visitorId: string | undefined;
      try {
        visitorId = localStorage.getItem("noddo_visitor_id") || undefined;
      } catch { /* localStorage unavailable */ }

      const res = await fetch(`${SUPABASE_FN_URL}/ghl-book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          phone: formPhone.trim()
            ? `${formCountryCode}${formPhone.replace(/\s+/g, "")}`
            : undefined,
          startTime,
          endTime,
          whatsappOptin: wantWA && !!formPhone.trim(),
          utmSource,
          utmMedium,
          utmCampaign,
          referrer,
          visitorId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Track conversion across all systems (Pixel + GA4 + CAPI)
      trackBookingConfirmed({
        email: formEmail,
        name: formName,
        phone: formPhone.trim()
          ? `${formCountryCode}${formPhone.replace(/\s+/g, "")}`
          : undefined,
      });

      // Save contact for GHL auto-tagging on future visits
      try {
        localStorage.setItem(
          "noddo_ghl_contact",
          JSON.stringify({ email: formEmail.trim().toLowerCase() })
        );
      } catch {
        // Silent fail
      }

      // Redirect to post-booking thank-you page
      const thankYouParams = new URLSearchParams({
        name: formName,
        date: selectedDate,
        time: selectedTime,
      });
      window.location.href = `/demo-confirmada?${thankYouParams.toString()}`;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error desconocido";
      console.error("[BookingFlow] Booking failed:", err);
      setBookingError(message);
      setStep("fallback");
    }
  }, [selectedCal, formName, formEmail, formPhone, formCountryCode, wantWA, selectedDate, selectedTime]);

  // ─── LOADING ──────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="w-8 h-8 text-[var(--mk-accent)] animate-spin" />
        <p className="text-sm text-[var(--mk-text-tertiary)]">
          {t("booking.loadingSlots")}
        </p>
      </div>
    );
  }

  // ─── FALLBACK ─────────────────────────────────────────────────────
  if (step === "fallback") {
    return <FallbackView onClose={onClose} />;
  }

  // ─── BOOKING (processing spinner) ─────────────────────────────────
  if (step === "booking") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="relative w-16 h-16">
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border border-[rgba(184,151,58,0.15)] border-t-[var(--mk-accent)] animate-spin" />
          {/* Photo inside */}
          <div className="absolute inset-2">
            <HostAvatar size={48} className="!border-0" />
          </div>
        </div>
        <p className="text-sm text-white font-bold">
          {t("booking.bookingInProgress")}
        </p>
        <p className="text-[10px] text-[var(--mk-text-tertiary)]">
          {t("booking.bookingWait")}
        </p>
      </div>
    );
  }

  // ─── SUCCESS ──────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <>
        {onClose && (
          <div className="flex justify-end p-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[var(--mk-text-tertiary)] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 pb-6 flex-1">
          {/* Success avatar with green ring */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4 animate-success-pop">
              <HostAvatar size={72} className="border-green-500/50" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-[#141414] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h2 className="font-heading text-2xl font-light text-[var(--mk-text-primary)] mb-1">
              {t("booking.successTitle")}
            </h2>
            <p className="text-sm text-[var(--mk-text-tertiary)] text-center capitalize">
              {formatDateLong(selectedDate, locale)} &middot; {selectedTime}
            </p>
          </div>

          {/* What happens next */}
          <div className="glass-booking rounded-xl p-4 mb-5">
            <p className="font-ui text-[9px] font-bold text-[var(--mk-accent)] uppercase tracking-[0.2em] mb-2">
              {t("booking.step2Label")}
            </p>
            <p className="text-sm font-bold text-white mb-1">
              {t("booking.step2Title")}
            </p>
            <p className="text-xs text-[var(--mk-text-tertiary)] leading-relaxed">
              {t("booking.step2Description")}
            </p>
          </div>

          {/* Host waiting strip */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <HostAvatar size={20} className="!border" />
            <p className="text-[11px] text-[var(--mk-text-tertiary)]">
              {t("booking.hostWaiting")}
            </p>
          </div>

          {/* Email confirmation */}
          <div className="text-center mb-5">
            <p className="text-xs text-[var(--mk-text-tertiary)]">
              {t("booking.emailConfirmation")}
              {formPhone && wantWA ? t("booking.emailAndWA") : ""}
            </p>
          </div>

          <button
            onClick={() => onClose?.()}
            className="w-full py-3.5 rounded-xl glass-booking border border-[rgba(184,151,58,0.2)] text-white font-bold text-sm hover:bg-[rgba(184,151,58,0.1)] transition-all"
          >
            {t("booking.backToSite")}
          </button>
        </div>
      </>
    );
  }

  // ─── CALENDAR STEP ────────────────────────────────────────────────
  if (step === "calendar") {
    return (
      <>
        {onClose && <ModalHeader onClose={onClose} />}
        <div className="overflow-y-auto px-5 pt-4 pb-5 flex-1">
          <HostCard />
          <StepIndicator currentStep={0} />
          <CallBadges />
          <DayPillGrid
            dates={availableDates}
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
          <button
            disabled={!selectedDate}
            onClick={() => {
              setSelectedTime("");
              setStep("timeslots");
              trackBookingDateSelected(selectedDate);
            }}
            className={`w-full mt-5 py-3.5 rounded-xl font-ui font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              selectedDate
                ? "btn-mk-primary shadow-[0_0_25px_rgba(184,151,58,0.2)]"
                : "bg-white/5 border border-white/10 text-white/25 cursor-not-allowed"
            }`}
          >
            {t("booking.next")}
            <ChevronRight className="w-4 h-4" />
          </button>
          <BookingInsight index={0} />
        </div>
      </>
    );
  }

  // ─── TIMESLOTS STEP ───────────────────────────────────────────────
  if (step === "timeslots") {
    return (
      <>
        {onClose && (
          <ModalHeader
            onClose={onClose}
            onBack={() => setStep("calendar")}
          />
        )}
        <div className="overflow-y-auto px-5 pt-4 pb-5 flex-1">
          <HostMiniCard />
          <StepIndicator currentStep={1} />
          <p className="text-center font-heading text-lg font-light text-white/80 mb-1 capitalize">
            {formatDateLong(selectedDate, locale)}
          </p>
          <p className="text-center text-[10px] text-[var(--mk-text-tertiary)] mb-5">
            {getGmtLabel(clientTz)}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(localSlots[selectedDate] || []).map((slot) => {
              const active = slot.localTime === selectedTime;
              return (
                <button
                  key={`${slot.calDate}-${slot.calTime}`}
                  onClick={() => {
                    setSelectedTime(slot.localTime);
                    setSelectedCal({
                      date: slot.calDate,
                      time: slot.calTime,
                    });
                  }}
                  className={`py-3.5 rounded-xl text-center font-bold text-sm transition-all ${
                    active
                      ? "border-2 border-[var(--mk-accent)] bg-[rgba(184,151,58,0.15)] text-white shadow-[0_0_15px_rgba(184,151,58,0.2)]"
                      : "glass-booking text-white/70 hover:border-[rgba(184,151,58,0.3)] hover:text-white"
                  }`}
                >
                  {slot.localTime}
                </button>
              );
            })}
          </div>

          <button
            disabled={!selectedTime}
            onClick={() => {
              setStep("confirm");
              trackBookingTimeSelected(selectedTime);
            }}
            className={`w-full mt-5 py-3.5 rounded-xl font-ui font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              selectedTime
                ? "btn-mk-primary shadow-[0_0_25px_rgba(184,151,58,0.2)]"
                : "bg-white/5 border border-white/10 text-white/25 cursor-not-allowed"
            }`}
          >
            {t("booking.confirmTime")}
            <ChevronRight className="w-4 h-4" />
          </button>
          <BookingInsight index={1} />
        </div>
      </>
    );
  }

  // ─── CONFIRM STEP ─────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <>
        {onClose && (
          <ModalHeader
            onClose={onClose}
            onBack={() => setStep("timeslots")}
          />
        )}
        <div className="overflow-y-auto px-5 pt-4 pb-5 flex-1">
          <StepIndicator currentStep={2} />

          {/* Summary with host avatar */}
          <div className="glass-booking rounded-xl p-4 mb-5 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[var(--mk-accent)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white capitalize">
                {formatDateLong(selectedDate, locale)}
              </p>
              <p className="text-xs text-[var(--mk-text-tertiary)]">
                {selectedTime} &middot; {SESSION_MINUTES} min &middot;{" "}
                {locale === "en" ? "Video call" : "Videollamada"}
              </p>
            </div>
            <HostAvatar size={28} className="!border" />
          </div>

          {/* Form */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="font-ui text-[10px] text-[var(--mk-text-tertiary)] font-bold uppercase tracking-wider mb-1 block">
                {t("booking.labelName")}
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="input-booking w-full"
                placeholder={t("booking.placeholderName")}
              />
            </div>
            <div>
              <label className="font-ui text-[10px] text-[var(--mk-text-tertiary)] font-bold uppercase tracking-wider mb-1 block">
                {t("booking.labelEmail")} <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="input-booking w-full"
                placeholder={t("booking.placeholderEmail")}
              />
            </div>
            <div>
              <label className="font-ui text-[10px] text-[var(--mk-text-tertiary)] font-bold uppercase tracking-wider mb-1 block">
                {t("booking.labelPhone")}
              </label>
              <div className="flex gap-2">
                <div className="w-[90px] sm:w-[110px] shrink-0">
                  <NodDoDropdown
                    variant="marketing"
                    size="md"
                    value={formCountryCode}
                    onChange={setFormCountryCode}
                    options={COUNTRY_CODES.map((c) => ({
                      value: c.code,
                      label: c.code,
                      metadata: { flag: c.flag },
                    }))}
                    renderOption={(opt) => (
                      <span>{String(opt.metadata?.flag ?? "")} {opt.label}</span>
                    )}
                    renderSelected={(opt) => (
                      <span>{String(opt.metadata?.flag ?? "")} {opt.label}</span>
                    )}
                  />
                </div>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="input-booking flex-1 min-w-0"
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={wantWA}
                onChange={(e) => setWantWA(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[var(--mk-accent)]"
              />
              <span className="text-xs text-white/60">
                {t("booking.waReminder")}
              </span>
            </label>
          </div>

          {bookingError && (
            <div className="text-center mb-3">
              <p className="text-xs text-red-400">{bookingError}</p>
            </div>
          )}

          {/* Book CTA */}
          <button
            disabled={!formEmail.includes("@")}
            onClick={handleBook}
            className={`w-full py-4 rounded-xl font-ui font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              formEmail.includes("@")
                ? "btn-mk-primary shadow-[0_0_30px_rgba(184,151,58,0.3)]"
                : "bg-white/5 border border-white/10 text-white/25 cursor-not-allowed"
            }`}
          >
            <Check className="w-5 h-5" />
            {t("booking.bookCta")}
          </button>

          {/* Trust */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[rgba(184,151,58,0.5)]" />
            <p className="text-[10px] text-[var(--mk-text-tertiary)]">
              {t("booking.trustLine")}
            </p>
          </div>
          <BookingInsight index={2} />
        </div>
      </>
    );
  }

  return null;
};

// ─── Helper ─────────────────────────────────────────────────────────────

function getCalendarOffset(date: string, time: string): string {
  try {
    const instant = new Date(`${date}T${time}:00`);
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: GHL_CALENDAR_TZ,
      timeZoneName: "longOffset",
    }).formatToParts(instant);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    const match = tzPart?.value?.match(/GMT([+-]\d{2}:\d{2})/);
    if (match) return match[1];
    if (tzPart?.value === "GMT") return "+00:00";
    return "-05:00"; // fallback for America/Bogota
  } catch {
    return "-05:00";
  }
}

export default BookingFlow;
