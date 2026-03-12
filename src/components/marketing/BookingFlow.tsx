"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Loader2,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  Clock,
  UserCheck,
  X,
} from "lucide-react";
import { useTranslation } from "@/i18n";
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
} from "@/lib/booking-constants";

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

// ─── Step Indicator ─────────────────────────────────────────────────────

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const { t } = useTranslation("common");
  const steps = [
    { icon: Calendar, label: t("booking.stepDate") },
    { icon: Clock, label: t("booking.stepTime") },
    { icon: UserCheck, label: t("booking.stepConfirm") },
  ];

  return (
    <div className="flex items-center justify-center gap-1 mb-5">
      {steps.map((s, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={s.label} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`w-6 h-px mx-0.5 ${
                  done ? "bg-[var(--mk-accent)]" : "bg-white/10"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  done
                    ? "bg-[var(--mk-accent)] text-[#141414]"
                    : active
                    ? "bg-[rgba(184,151,58,0.2)] border border-[var(--mk-accent)] text-[var(--mk-accent)]"
                    : "bg-white/5 border border-white/10 text-white/30"
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={`font-ui text-[10px] font-bold uppercase tracking-wider ${
                  done || active ? "text-white/80" : "text-white/25"
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Session Card ───────────────────────────────────────────────────────

const SessionCard = () => {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col items-center pt-4 pb-3">
      <div className="w-14 h-14 rounded-full bg-[rgba(184,151,58,0.15)] border-2 border-[rgba(184,151,58,0.3)] flex items-center justify-center mb-2">
        <Calendar className="w-6 h-6 text-[var(--mk-accent)]" />
      </div>
      <p className="font-ui text-sm font-bold text-[var(--mk-text-primary)] uppercase tracking-wide">
        {t("booking.sessionTitle")}
      </p>
      <p className="text-[10px] text-[var(--mk-text-tertiary)] mt-0.5">
        {t("booking.sessionSub")}
      </p>
    </div>
  );
};

// ─── Scarcity Banner ────────────────────────────────────────────────────

const ScarcityBanner = ({ totalSlots }: { totalSlots: number }) => {
  const { t } = useTranslation("common");
  return (
    <div className="glass-booking rounded-xl p-3 mb-5 flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[var(--mk-accent)] animate-pulse" />
      <p className="text-xs font-bold text-white/80">
        {t("booking.scarcityPrefix")}
        <span className="text-[var(--mk-accent)] font-black">{totalSlots}</span>
        {t("booking.scarcitySuffix")}
      </p>
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

      <div className="grid grid-cols-5 gap-2">
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
              <p className="text-[8px] text-green-400/60 mt-0.5">●</p>
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
      } catch (err) {
        console.error("[BookingFlow] Failed to fetch slots:", err);
        setStep("fallback");
      }
    };

    fetchSlots();
  }, [step, clientTz]);

  const availableDates = Object.keys(localSlots).sort();
  const rawTotalSlots = Object.values(localSlots).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  const totalSlots = Math.min(rawTotalSlots, 7);

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
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setStep("success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error desconocido";
      console.error("[BookingFlow] Booking failed:", err);
      setBookingError(message);
      setStep("fallback");
    }
  }, [selectedCal, formName, formEmail, formPhone, formCountryCode]);

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

  // ─── BOOKING (loading spinner) ────────────────────────────────────
  if (step === "booking") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="w-16 h-16 rounded-full bg-[rgba(184,151,58,0.1)] border border-[rgba(184,151,58,0.3)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--mk-accent)] animate-spin" />
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
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center mb-4 animate-success-pop">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="font-heading text-2xl font-light text-[var(--mk-text-primary)] mb-1">
              {t("booking.successTitle")}
            </h2>
            <p className="text-sm text-[var(--mk-text-tertiary)] text-center capitalize">
              {formatDateLong(selectedDate, locale)} · {selectedTime}
            </p>
          </div>

          <div className="glass-booking rounded-xl p-4 mb-6">
            <p className="font-ui text-xs font-bold text-[var(--mk-accent)] uppercase tracking-widest mb-2">
              {t("booking.step2Label")}
            </p>
            <p className="text-sm font-bold text-white mb-1">
              {t("booking.step2Title")}
            </p>
            <p className="text-xs text-[var(--mk-text-tertiary)]">
              {t("booking.step2Description")}
            </p>
          </div>

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
        <div className="overflow-y-auto px-5 pt-5 pb-5 flex-1">
          <SessionCard />
          <StepIndicator currentStep={0} />
          <ScarcityBanner totalSlots={totalSlots} />
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
        <div className="overflow-y-auto px-5 pt-5 pb-5 flex-1">
          <StepIndicator currentStep={1} />
          <p className="text-center text-sm text-white/70 font-bold mb-1 capitalize">
            {formatDateLong(selectedDate, locale)}
          </p>
          <p className="text-center text-[10px] text-[var(--mk-text-tertiary)] mb-5">
            {getGmtLabel(clientTz)}
          </p>

          <div className="grid grid-cols-3 gap-2.5">
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
            onClick={() => setStep("confirm")}
            className={`w-full mt-5 py-3.5 rounded-xl font-ui font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              selectedTime
                ? "btn-mk-primary shadow-[0_0_25px_rgba(184,151,58,0.2)]"
                : "bg-white/5 border border-white/10 text-white/25 cursor-not-allowed"
            }`}
          >
            {t("booking.confirmTime")}
            <ChevronRight className="w-4 h-4" />
          </button>
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
        <div className="overflow-y-auto px-5 pt-5 pb-5 flex-1">
          <StepIndicator currentStep={2} />

          {/* Summary */}
          <div className="glass-booking rounded-xl p-4 mb-5 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[var(--mk-accent)] shrink-0" />
            <div>
              <p className="text-sm font-bold text-white capitalize">
                {formatDateLong(selectedDate, locale)}
              </p>
              <p className="text-xs text-[var(--mk-text-tertiary)]">
                {selectedTime} · {SESSION_MINUTES} min ·{" "}
                {locale === "en" ? "Video call" : "Videollamada"}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3 mb-5">
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
                <select
                  value={formCountryCode}
                  onChange={(e) => setFormCountryCode(e.target.value)}
                  className="input-booking w-[110px] shrink-0 appearance-none cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option
                      key={c.code}
                      value={c.code}
                      className="bg-[#1a1a1a] text-white"
                    >
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
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
