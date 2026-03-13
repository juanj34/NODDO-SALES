# Booking & Calendar Module — Reference for Porting

> All code needed to replicate the lead capture + calendar booking system in another project.
> Stack: React 18 + TypeScript + Tailwind CSS + Supabase Edge Functions (Deno) + GoHighLevel CRM.

---

## 1. Architecture & Flow

```
User clicks CTA → BookingModal (portal) → BookingFlow (4-step wizard)
                                            ├── Loading (fetch slots from ghl-slots)
                                            ├── Calendar (select date)
                                            ├── Timeslots (select time, timezone-converted)
                                            ├── Confirm (name/email/phone form)
                                            └── Success / Fallback (GHL iframe)

Auto-trigger: BookingPopup (45s delay, countdown timer) → opens BookingModal

Server-side:
  ghl-slots  → Proxy for GHL free-slots API (date→epoch ms conversion)
  ghl-book   → Upsert contact → Create appointment → Trigger confirmation
  booking-handler → Confirmation email+WA, reminders (24h/2h/15min), no-show recovery
```

**NPM Dependencies:** `react`, `react-dom`, `lucide-react`, `tailwindcss`

---

## 2. Constants & Configuration

**File: `src/lib/constants.ts`**

```typescript
/** GoHighLevel booking widget URL */
export const GHL_CALENDAR_ID = "eVRqVmkOERUGtMpjuEYT";
export const GHL_BOOKING_URL = `https://msgsndr.com/widget/booking?calendar=${GHL_CALENDAR_ID}`;

// Supabase Edge Functions base URL
export const SUPABASE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Currency conversion rates
export const EUR_TO_AED = 4.0;
```

**Environment Variables Needed:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 3. Frontend Components

### 3.1 BookingModal.tsx — Portal Wrapper

```tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BookingFlow from "./BookingFlow";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  profileType?: string;
  budgetRange?: string;
  zoneType?: string;
  resultId?: string;
}

const BookingModal = ({
  open,
  onClose,
  userName,
  userEmail,
  profileType,
  budgetRange,
  zoneType,
  resultId,
}: BookingModalProps) => {
  // Key forces full remount (state reset) each time modal opens
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setMountKey((k) => k + 1);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg flex flex-col sm:rounded-2xl overflow-hidden border-0 sm:border border-primary/30 shadow-[0_0_60px_rgba(13,89,242,0.2)] bg-[#0d1117]">
        <BookingFlow
          key={mountKey}
          userName={userName}
          userEmail={userEmail}
          profileType={profileType}
          budgetRange={budgetRange}
          zoneType={zoneType}
          resultId={resultId}
          onClose={onClose}
          inline={false}
        />
      </div>
    </div>,
    document.body
  );
};

export default BookingModal;
```

### 3.2 BookingFlow.tsx — Main Booking Wizard (950 lines)

```tsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { GHL_BOOKING_URL, SUPABASE_FN_URL } from "@/lib/constants";
import avatarJuan from "@/assets/avatar-juan.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { track } from "@/lib/analytics";
import { trackScheduleConsultation, trackBookingStarted, trackBookingCompleted } from "@/lib/gtm";

// ─── Types ──────────────────────────────────────────────────────────────
export interface BookingFlowProps {
  userName?: string;
  userEmail?: string;
  profileType?: string;
  budgetRange?: string;
  zoneType?: string;
  resultId?: string;
  onComplete?: () => void;
  onClose?: () => void; // only used in modal mode
  inline?: boolean;
}

type Step = "loading" | "calendar" | "timeslots" | "confirm" | "booking" | "success" | "fallback";
type SlotsData = Record<string, string[]>;
type LocalSlot = { localTime: string; dubaiDate: string; dubaiTime: string };
type LocalSlotsData = Record<string, LocalSlot[]>;

// ─── Constants ──────────────────────────────────────────────────────────
const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const LONG_DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const LONG_DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WA_URL =
  "https://wa.me/971565005702?text=Hola%20Juan,%20completé%20el%20quiz%20DXB%20Prime%20y%20quiero%20agendar%20mi%20sesión%20estratégica";

const SESSION_MINUTES = 15;
const MAX_DISPLAY_SLOTS = 5;

const COUNTRY_CODES = [
  { code: "+971", flag: "🇦🇪" },
  { code: "+34",  flag: "🇪🇸" },
  { code: "+57",  flag: "🇨🇴" },
  { code: "+52",  flag: "🇲🇽" },
  { code: "+54",  flag: "🇦🇷" },
  { code: "+44",  flag: "🇬🇧" },
  { code: "+1",   flag: "🇺🇸" },
  { code: "+49",  flag: "🇩🇪" },
  { code: "+33",  flag: "🇫🇷" },
  { code: "+39",  flag: "🇮🇹" },
  { code: "+56",  flag: "🇨🇱" },
  { code: "+51",  flag: "🇵🇪" },
  { code: "+55",  flag: "🇧🇷" },
  { code: "+351", flag: "🇵🇹" },
  { code: "+91",  flag: "🇮🇳" },
  { code: "+966", flag: "🇸🇦" },
];

// ─── Helpers ────────────────────────────────────────────────────────────
function formatDateLong(dateStr: string, lang: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (lang === "en") {
    const dayName = LONG_DAY_NAMES_EN[d.getDay()];
    const day = d.getDate();
    const month = MONTH_NAMES_EN[d.getMonth()];
    return `${dayName}, ${month} ${day}`;
  }
  const dayName = LONG_DAY_NAMES_ES[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES_ES[d.getMonth()].toLowerCase();
  return `${dayName}, ${day} de ${month}`;
}

// ─── Timezone Helpers ───────────────────────────────────────────────────
function dubaiToLocal(dubaiDate: string, dubaiTime: string, clientTz: string) {
  const instant = new Date(`${dubaiDate}T${dubaiTime}:00+04:00`);
  const localTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: clientTz,
  }).format(instant);
  const localDate = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: clientTz,
  }).format(instant);
  return { localDate, localTime };
}

function todayInDubai(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function getGmtLabel(tz: string): string {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: tz, timeZoneName: "shortOffset",
    }).formatToParts(now);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || tz;
  } catch {
    return tz;
  }
}

// ─── Step Indicator ─────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const { t } = useLanguage();
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
              <div className={`w-6 h-px mx-0.5 ${done ? "bg-primary" : "bg-white/10"}`} />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  done
                    ? "bg-primary text-white"
                    : active
                    ? "bg-primary/20 border border-primary text-primary"
                    : "bg-white/5 border border-white/10 text-white/30"
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
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

// ─── Advisor Card ───────────────────────────────────────────────────────
export const AdvisorCard = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center pt-4 pb-3">
      <img
        src={avatarJuan}
        alt="Juan Jaramillo"
        className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shadow-[0_0_20px_rgba(13,89,242,0.2)] mb-2"
      />
      <p className="text-sm font-black text-white">{t("booking.sessionTitle")}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {t("booking.sessionSub")}
      </p>
    </div>
  );
};

// ─── Scarcity Banner ────────────────────────────────────────────────────
const ScarcityBanner = ({ totalSlots }: { totalSlots: number }) => {
  const { t } = useLanguage();
  return (
    <div className="glass-surface rounded-xl p-3 mb-5 flex items-center justify-center gap-2">
      <span className="text-sm">🔥</span>
      <p className="text-xs font-bold text-white/80">
        {t("booking.scarcityPrefix")}<span className="text-secondary font-black">{totalSlots}</span>{t("booking.scarcitySuffix")}
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
  const { t, language } = useLanguage();
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const totalPages = Math.ceil(dates.length / pageSize);
  const pageDates = dates.slice(page * pageSize, (page + 1) * pageSize);

  const firstDate = pageDates[0] ? new Date(pageDates[0] + "T00:00:00") : new Date();
  const monthNames = language === "en" ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const monthLabel = `${monthNames[firstDate.getMonth()]} ${firstDate.getFullYear()}`;

  const dayNames = [
    t("booking.daySun"), t("booking.dayMon"), t("booking.dayTue"),
    t("booking.dayWed"), t("booking.dayThu"), t("booking.dayFri"), t("booking.daySat"),
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
                  ? "border-2 border-primary bg-primary/10 shadow-[0_0_15px_rgba(13,89,242,0.25)]"
                  : "glass-surface border border-white/10 hover:border-primary/30"
              }`}
            >
              <p
                className={`text-[10px] font-bold uppercase ${
                  isSelected ? "text-primary" : "text-white/40"
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

// ─── Fallback (GHL iframe) ──────────────────────────────────────────────
const FallbackView = ({
  onClose,
  userName,
  userEmail,
  inline,
}: {
  onClose?: () => void;
  userName?: string;
  userEmail?: string;
  inline?: boolean;
}) => {
  const { t } = useLanguage();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(timer);
  }, []);

  const params = new URLSearchParams();
  if (userName) params.set("name", userName);
  if (userEmail) params.set("email", userEmail);
  const bookingUrl = `${GHL_BOOKING_URL}&${params.toString()}`;

  return (
    <>
      {/* Header — only in modal mode */}
      {!inline && onClose && (
        <div className="bg-[#1a2232] border-b border-primary/20 px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="flex-1">
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              {t("booking.fallbackTitle")}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {t("booking.fallbackSub")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className={`relative ${inline ? "min-h-[500px]" : "flex-1 min-h-[500px] sm:min-h-[580px]"}`}>
        {!iframeLoaded && !timedOut && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">{t("booking.fallbackLoading")}</p>
          </div>
        )}

        {timedOut && !iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 px-6">
            <p className="text-sm text-white font-bold text-center">
              {t("booking.fallbackProblem")}
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              {t("booking.fallbackDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl gold-cta-gradient text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t("booking.fallbackOpen")}
              </a>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl glass-surface-strong border border-green-500/30 text-green-400 font-bold text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </div>
          </div>
        )}

        <iframe
          src={bookingUrl}
          className={`w-full h-full ${inline ? "min-h-[500px]" : "min-h-[500px] sm:min-h-[580px]"}`}
          style={{ border: "none", opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
          onLoad={() => setIframeLoaded(true)}
          title={t("booking.fallbackTitle")}
        />
      </div>

      {/* Footer — only in modal mode */}
      {!inline && (
        <div className="bg-[#1a2232] border-t border-primary/20 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary/60" />
            <p className="text-[10px] text-muted-foreground">{t("booking.fallbackFooter")}</p>
          </div>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            WhatsApp
          </a>
        </div>
      )}
    </>
  );
};

// ─── Header (modal mode only) ───────────────────────────────────────────
const ModalHeader = ({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack?: () => void;
}) => {
  const { t } = useLanguage();
  return (
    <div className="bg-[#1a2232] border-b border-primary/20 px-4 py-3 flex items-center gap-2 shrink-0">
      {onBack && (
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-black text-white uppercase tracking-wide">
          {t("booking.agendaHeader")}
        </h3>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

// ─── Inline Back Button (inline mode) ───────────────────────────────────
const InlineBackButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-4"
  >
    <ChevronLeft className="w-4 h-4" />
    {label}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════
// ─── Main BookingFlow Component ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
const BookingFlow = ({
  userName,
  userEmail,
  profileType,
  budgetRange,
  zoneType,
  resultId,
  onComplete,
  onClose,
  inline = false,
}: BookingFlowProps) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<Step>("loading");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formName, setFormName] = useState(userName || "");
  const [formEmail, setFormEmail] = useState(userEmail || "");
  const [formPhone, setFormPhone] = useState("");
  const [formCountryCode, setFormCountryCode] = useState("+971");
  const [wantWA, setWantWA] = useState(true);
  const [bookingError, setBookingError] = useState("");
  const [localSlots, setLocalSlots] = useState<LocalSlotsData>({});
  const [selectedDubai, setSelectedDubai] = useState({ date: "", time: "" });

  const clientTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
    catch { return "Asia/Dubai"; }
  }, []);

  // Analytics: track booking opened + abandoned on unmount
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    track("booking_opened", 26);
    trackBookingStarted(); // GA4/GTM
    return () => {
      if (stepRef.current !== "success") track("booking_abandoned", 26, { lastStep: stepRef.current });
    };
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    setFormName(userName || "");
    setFormEmail(userEmail || "");
  }, [userName, userEmail]);

  // Fetch slots on mount
  useEffect(() => {
    if (step !== "loading") return;

    const fetchSlots = async () => {
      try {
        const dubaiNow = todayInDubai();
        const dubaiToday = new Date(dubaiNow + "T12:00:00+04:00");
        const start = new Date(dubaiToday);
        start.setDate(start.getDate() + 1);
        const end = new Date(start);
        end.setDate(end.getDate() + 13);

        const fmtDubai = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit",
        });
        const startStr = fmtDubai.format(start);
        const endStr = fmtDubai.format(end);

        const res = await fetch(
          `${SUPABASE_FN_URL}/ghl-slots?startDate=${startStr}&endDate=${endStr}`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ""}`,
            },
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const validSlots: SlotsData = {};
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

        // Convert Dubai slots to client's local timezone
        const local: LocalSlotsData = {};
        for (const [dDate, times] of Object.entries(validSlots)) {
          for (const dTime of times) {
            const { localDate, localTime } = dubaiToLocal(dDate, dTime, clientTz);
            if (!local[localDate]) local[localDate] = [];
            local[localDate].push({ localTime, dubaiDate: dDate, dubaiTime: dTime });
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
  const rawTotalSlots = Object.values(localSlots).reduce((sum, arr) => sum + arr.length, 0);
  const totalSlots = Math.min(rawTotalSlots, 7);

  // Handle booking submission
  const handleBook = useCallback(async () => {
    if (!selectedDubai.date || !selectedDubai.time || !formEmail) return;

    setStep("booking");
    setBookingError("");

    try {
      const startTime = `${selectedDubai.date}T${selectedDubai.time}:00+04:00`;
      const startInstant = new Date(startTime);
      const endInstant = new Date(startInstant.getTime() + SESSION_MINUTES * 60_000);

      const endDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(endInstant);
      const endTimeStr = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(endInstant);
      const endTime = `${endDateStr}T${endTimeStr}:00+04:00`;

      const res = await fetch(`${SUPABASE_FN_URL}/ghl-book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ""}`,
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          phone: formPhone.trim() ? `${formCountryCode}${formPhone.replace(/\s+/g, '')}` : undefined,
          startTime,
          endTime,
          profileType,
          budgetRange,
          zoneType,
          resultId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setStep("success");
      track("booking_completed", 26, { date: selectedDubai.date, time: selectedDubai.time });
      trackBookingCompleted(selectedDubai.date, selectedDubai.time, profileType || "unknown");
      trackScheduleConsultation(profileType || "unknown");
      onComplete?.();
    } catch (err: any) {
      console.error("[BookingFlow] Booking failed:", err);
      setBookingError(err.message || "Error");
      setStep("fallback");
    }
  }, [selectedDubai, formName, formEmail, formPhone, formCountryCode, wantWA, profileType, budgetRange, zoneType, resultId, onComplete]);

  // ─── LOADING ──────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{t("booking.loadingSlots")}</p>
      </div>
    );
  }

  // ─── FALLBACK ─────────────────────────────────────────────────────
  if (step === "fallback") {
    return <FallbackView onClose={onClose} userName={userName} userEmail={userEmail} inline={inline} />;
  }

  // ─── BOOKING (loading spinner) ────────────────────────────────────
  if (step === "booking") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <p className="text-sm text-white font-bold">{t("booking.bookingInProgress")}</p>
        <p className="text-[10px] text-muted-foreground">{t("booking.bookingWait")}</p>
      </div>
    );
  }

  // ─── SUCCESS ──────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <>
        {!inline && onClose && (
          <div className="flex justify-end p-3">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className={`overflow-y-auto px-5 pb-6 ${inline ? "" : "flex-1"}`}>
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center mb-4 animate-success-pop">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide mb-1">
              {t("booking.successTitle")}
            </h2>
            <p className="text-sm text-muted-foreground text-center capitalize">
              {formatDateLong(selectedDate, language)} · {selectedTime}
            </p>
          </div>

          <div className="glass-surface rounded-xl p-4 mb-6">
            <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">
              {t("booking.step2Label")}
            </p>
            <p className="text-sm font-bold text-white mb-1">{t("booking.step2Title")}</p>
            <p className="text-xs text-muted-foreground">{t("booking.step2Description")}</p>
          </div>

          <div className="text-center mb-5">
            <p className="text-xs text-muted-foreground">
              {t("booking.emailConfirmation")}
              {formPhone && wantWA ? t("booking.emailAndWA") : ""}
            </p>
          </div>

          <button
            onClick={() => onClose?.()}
            className="w-full py-3.5 rounded-xl glass-surface-strong border border-primary/20 text-white font-bold text-sm hover:bg-primary/10 transition-all"
          >
            {t("booking.backToResults")}
          </button>
        </div>
      </>
    );
  }

  // ─── CALENDAR STEP ────────────────────────────────────────────────
  if (step === "calendar") {
    return (
      <>
        {!inline && onClose && <ModalHeader onClose={onClose} />}
        <div className={`overflow-y-auto px-5 pt-5 pb-5 ${inline ? "" : "flex-1"}`}>
          <AdvisorCard />
          <StepIndicator currentStep={0} />
          <ScarcityBanner totalSlots={totalSlots} />
          <DayPillGrid dates={availableDates} selected={selectedDate} onSelect={setSelectedDate} />
          <button
            disabled={!selectedDate}
            onClick={() => {
              track("booking_date_selected", 26, { date: selectedDate });
              setSelectedTime("");
              setStep("timeslots");
            }}
            className={`w-full mt-5 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              selectedDate
                ? "cta-gradient text-secondary-foreground hover-lift click-press shadow-[0_0_25px_rgba(255,140,0,0.3)]"
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
        {!inline && onClose ? (
          <ModalHeader onClose={onClose} onBack={() => setStep("calendar")} />
        ) : (
          <div className="px-5">
            <InlineBackButton onClick={() => setStep("calendar")} label={t("booking.changeDate")} />
          </div>
        )}
        <div className={`overflow-y-auto px-5 pt-5 pb-5 ${inline ? "" : "flex-1"}`}>
          <StepIndicator currentStep={1} />
          <p className="text-center text-sm text-white/70 font-bold mb-1 capitalize">
            {formatDateLong(selectedDate, language)}
          </p>
          <p className="text-center text-[10px] text-muted-foreground mb-5">
            {getGmtLabel(clientTz)}
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {(localSlots[selectedDate] || []).map((slot) => {
              const active = slot.localTime === selectedTime;
              return (
                <button
                  key={`${slot.dubaiDate}-${slot.dubaiTime}`}
                  onClick={() => {
                    setSelectedTime(slot.localTime);
                    setSelectedDubai({ date: slot.dubaiDate, time: slot.dubaiTime });
                    track("booking_time_selected", 26, { time: slot.localTime });
                  }}
                  className={`py-3.5 rounded-xl text-center font-bold text-sm transition-all ${
                    active
                      ? "border-2 border-primary bg-primary/15 text-white shadow-[0_0_15px_rgba(13,89,242,0.3)]"
                      : "glass-surface border border-white/10 text-white/70 hover:border-primary/40 hover:text-white"
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
            className={`w-full mt-5 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              selectedTime
                ? "cta-gradient text-secondary-foreground hover-lift click-press shadow-[0_0_25px_rgba(255,140,0,0.3)]"
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
        {!inline && onClose ? (
          <ModalHeader onClose={onClose} onBack={() => setStep("timeslots")} />
        ) : (
          <div className="px-5">
            <InlineBackButton onClick={() => setStep("timeslots")} label={t("booking.changeTime")} />
          </div>
        )}
        <div className={`overflow-y-auto px-5 pt-5 pb-5 ${inline ? "" : "flex-1"}`}>
          <StepIndicator currentStep={2} />

          {/* Summary */}
          <div className="glass-surface rounded-xl p-4 mb-5 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-white capitalize">
                {formatDateLong(selectedDate, language)}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedTime} · 15 min · {language === "en" ? "Video call" : "Videollamada"}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 block">
                {t("booking.labelName")}
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={t("booking.placeholderName")}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 block">
                {t("booking.labelEmail")}
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={t("booking.placeholderEmail")}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 block">
                {t("booking.labelPhone")} <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formCountryCode}
                  onChange={(e) => setFormCountryCode(e.target.value)}
                  className="w-[110px] shrink-0 px-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#1a2232] text-white">
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={wantWA}
                onChange={(e) => setWantWA(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30"
              />
              <span className="text-xs text-white/60">{t("booking.waReminder")}</span>
            </label>
          </div>

          {bookingError && (
            <div className="text-center mb-3">
              <p className="text-xs text-red-400">{bookingError}</p>
            </div>
          )}

          {/* Book CTA */}
          <button
            disabled={!formEmail.includes("@") || formPhone.trim().length < 6}
            onClick={handleBook}
            className={`w-full py-4 rounded-xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              formEmail.includes("@") && formPhone.trim().length >= 6
                ? "cta-gradient text-secondary-foreground hover-lift click-press shadow-[0_0_30px_rgba(255,140,0,0.4)] cta-pulse"
                : "bg-white/5 border border-white/10 text-white/25 cursor-not-allowed"
            }`}
          >
            <Check className="w-5 h-5" />
            {t("booking.bookCta")}
          </button>

          {/* Trust */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <ShieldCheck className="w-3.5 h-3.5 text-primary/50" />
            <p className="text-[10px] text-muted-foreground">{t("booking.trustLine")}</p>
          </div>
          <p className="text-[10px] text-white/40 text-center mt-3">
            {t("booking.privacyText")}{" "}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline text-primary/60 hover:text-primary">
              {t("booking.privacyLink")}
            </a>
          </p>
        </div>
      </>
    );
  }

  return null;
};

export default BookingFlow;
```

### 3.3 BookingPopup.tsx — Auto-Trigger Popup (45s delay + countdown)

```tsx
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Clock, Zap } from "lucide-react";
import avatarJuan from "@/assets/avatar-juan.png";
import { useLanguage } from "@/i18n/LanguageContext";

interface BookingPopupProps {
  profileTitle: string;
  profileTitleEn?: string;
  onBooking: () => void;
}

const POPUP_DISMISSED_KEY = "dxb-booking-popup-dismissed";
const POPUP_DELAY_MS = 45_000; // 45 seconds

const BookingPopup = ({ profileTitle, profileTitleEn, onBooking }: BookingPopupProps) => {
  const { t, L } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(180); // 3 minutes in seconds

  // Show popup after delay (only if not previously dismissed)
  useEffect(() => {
    if (sessionStorage.getItem(POPUP_DISMISSED_KEY)) return;
    const showTimer = setTimeout(() => setVisible(true), POPUP_DELAY_MS);
    return () => clearTimeout(showTimer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!visible || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, countdown]);

  // Block body scroll when visible
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(POPUP_DISMISSED_KEY, "1");
  }, []);

  const handleBook = useCallback(() => {
    dismiss();
    onBooking();
  }, [dismiss, onBooking]);

  if (!visible) return null;

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={dismiss} />
      <div className="relative w-full max-w-sm bg-[#1a2232] border border-primary/20 rounded-2xl shadow-[0_0_60px_rgba(13,89,242,0.2)] animate-fade-in-up overflow-hidden">
        <button onClick={dismiss} className="absolute top-3 right-3 z-10 p-1.5 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-secondary" />
        <div className="p-6 pt-5">
          <div className="flex items-center gap-3 mb-5">
            <img src={avatarJuan} alt="Juan Jaramillo" className="w-12 h-12 rounded-full border-2 border-primary/40 object-cover" />
            <div>
              <p className="text-sm font-bold text-white">Juan Jaramillo</p>
              <p className="text-[10px] text-slate-400 font-medium">{t("bookingPopup.advisorSub")}</p>
            </div>
          </div>
          <h3 className="text-lg font-black text-white leading-tight mb-2">{t("bookingPopup.headline")}</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-5">
            {t("bookingPopup.bodyStart")}<span className="text-primary font-bold">{L(profileTitle, profileTitleEn)}</span>{t("bookingPopup.bodyEnd")}
          </p>
          <div className="flex items-center justify-between bg-background/60 rounded-xl px-4 py-3 mb-5 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs text-slate-300 font-semibold">{t("bookingPopup.scarcity")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-secondary" />
              <span className="text-xs font-mono font-bold text-secondary">{timeStr}</span>
            </div>
          </div>
          <button onClick={handleBook} className="w-full py-4 rounded-xl gold-cta-gradient text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover-lift click-press transition-all shadow-[0_4px_20px_rgba(255,140,0,0.3)]">
            <Zap className="w-4 h-4" />
            {t("bookingPopup.cta")}
          </button>
          <button onClick={dismiss} className="w-full mt-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">
            {t("bookingPopup.dismiss")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BookingPopup;
```

### 3.4 AdvisorCTA.tsx — CTA Section with Trust Signals

```tsx
import avatarJuan from "@/assets/avatar-juan.png";
import { Lock, CheckCircle, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface AdvisorCTAProps {
  userName?: string;
  onBooking: () => void;
}

const AdvisorCTA = ({ userName, onBooking }: AdvisorCTAProps) => {
  const { t } = useLanguage();

  const sessionIncludes = [
    t("advisor.session1"),
    t("advisor.session2"),
    t("advisor.session3"),
    t("advisor.session4"),
  ];

  return (
    <section className="section-reveal" style={{ animationDelay: "1600ms" }}>
      <div className="glass-surface-strong rounded-2xl overflow-hidden relative border border-secondary/20 shadow-[0_0_30px_rgba(255,140,0,0.1)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="p-6 md:p-8 text-center md:text-left border-b border-border/30">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-4 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{t("advisor.restricted")}</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-foreground mb-2">
            {userName ? `${userName}, ${t("advisor.headingWithName")}` : t("advisor.headingNoName")}
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed max-w-lg mx-auto md:mx-0">{t("advisor.description")}</p>
        </div>
        <div className="px-6 md:px-8 py-6 md:py-8 bg-background/40">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full gold-gradient animate-pulse blur-md opacity-30" />
              <img src={avatarJuan} alt="Advisor" className="relative w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-2 border-secondary/50 shadow-[0_0_20px_rgba(255,140,0,0.2)]" />
              <div className="absolute -bottom-2 -right-2 bg-secondary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full border border-background shadow-lg">INSIDER</div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">{t("advisor.advisorTitle")}</h4>
              <p className="text-xs text-secondary font-bold uppercase tracking-widest mt-0.5">{t("advisor.advisorSub")}</p>
              <div className="mt-5 space-y-2.5 bg-black/20 rounded-xl p-4 border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">{t("advisor.sessionBadge")}</p>
                {sessionIncludes.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground/90 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onBooking} className="w-full mt-8 py-4 md:py-5 rounded-xl gold-cta-gradient text-black font-black text-sm md:text-lg uppercase tracking-wider flex items-center justify-center gap-2 hover-lift click-press shadow-[0_0_30px_rgba(255,140,0,0.3)] hover:shadow-[0_0_40px_rgba(255,140,0,0.5)] transition-all cta-pulse group">
            <Lock className="w-5 h-5 text-black group-hover:scale-110 transition-transform mb-0.5" />
            {t("advisor.cta")}
          </button>
          <div className="mt-5 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-muted-foreground font-semibold">{t("advisor.scarcity")}</p>
            </div>
            <div className="hidden md:block w-1 h-1 rounded-full bg-border" />
            <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">{t("advisor.trust")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvisorCTA;
```

### 3.5 DataCaptureScreen.tsx — Email Capture Form

```tsx
import { useState, useEffect, useRef } from "react";
import { LockIcon, LockOpenIcon, ShieldIcon, MailIcon, CheckCircleIcon } from "./icons/ThemedIcons";
import { useLanguage } from "@/i18n/LanguageContext";
import avatarJuan from "@/assets/avatar-juan.png";
import { QuizState, ContactInfo } from "@/types/quiz";
import ParticleEffect from "./ParticleEffect";

interface DataCaptureScreenProps {
  onSubmit: (info: ContactInfo) => void;
  state: QuizState;
}

const checksData = [
  { labelKey: "checkProfile", key: "investorType", mapKeys: { opportunity: "mapOpportunity", security: "mapSecurity", end_user: "mapEndUser", unsure: "mapUnsure" } },
  { labelKey: "checkGoal", key: "investmentGoal", mapKeys: { rental: "mapRental", appreciation: "mapAppreciation", flip: "mapFlip", personal: "mapPersonal" } },
  { labelKey: "checkProperty", key: "propertyType", mapKeys: { studio: "mapStudio", "1bed": "map1bed", family_apt: "mapFamilyApt", townhouse: "mapTownhouse", villa: "mapVilla" } },
  { labelKey: "checkBudget", key: "budgetRange", mapKeys: { "200_400k": "€200K–€400K", "400_800k": "€400K–€800K", "800k_1_5m": "€800K–€1.5M", "over_1_5m": "+€1.5M" } },
];

const DataCaptureScreen = ({ onSubmit, state }: DataCaptureScreenProps) => {
  const { t } = useLanguage();
  const [visibleChecks, setVisibleChecks] = useState(0);
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checksData.forEach((_, i) => {
      setTimeout(() => setVisibleChecks(i + 1), 600 * (i + 1));
    });
    setTimeout(() => setShowForm(true), 600 * checksData.length + 400);
  }, []);

  useEffect(() => {
    if (showForm && emailRef.current) {
      setTimeout(() => emailRef.current?.focus(), 300);
    }
  }, [showForm]);

  const isValid = email.trim().includes("@");
  const [showParticles, setShowParticles] = useState(false);
  const [wasValid, setWasValid] = useState(false);

  useEffect(() => {
    if (isValid && !wasValid) {
      setShowParticles(true);
      setWasValid(true);
      setTimeout(() => setShowParticles(false), 1200);
    }
    if (!isValid) setWasValid(false);
  }, [isValid, wasValid]);

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({ name: state.userName || "", whatsapp: "", countryCode: "+34", email: email.trim(), wantsSession: false });
  };

  return (
    <div className="flex flex-col items-center min-h-screen px-6 pt-[108px] pb-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,89,242,0.08)_0%,transparent_50%)] pointer-events-none" />
      <div className="w-full max-w-md lg:max-w-lg animate-fade-in relative z-10">
        <div className="text-center mb-6 relative">
          <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-500 ${isValid
            ? "bg-primary/20 border border-primary/50 shadow-[0_0_30px_rgba(13,89,242,0.4)]"
            : "glass-surface-strong border border-primary/30"
            }`}>
            {isValid ? (
              <LockOpenIcon className="w-7 h-7 text-primary animate-scale-in drop-shadow-[0_0_8px_rgba(13,89,242,0.8)]" size={28} />
            ) : (
              <LockIcon className="w-7 h-7 text-primary/60" size={28} />
            )}
          </div>
          <ParticleEffect active={showParticles} count={16} />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-3 animate-pulse">
            <CheckCircleIcon className="w-3.5 h-3.5 text-primary" size={14} />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t("capture.badge")}</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground leading-tight mb-2">{t("capture.heading")}</h2>
          <div className="inline-block bg-accent/20 border border-accent/40 rounded px-2 py-0.5 mb-2">
            <span className="text-[11px] lg:text-sm font-bold text-accent">{t("capture.valueBadge")}</span>
          </div>
        </div>

        {/* Animated checks */}
        <div className="glass-surface rounded-xl p-4 mb-5 space-y-2.5">
          {checksData.map((check, i) => {
            const value = (state as any)[check.key] || "";
            const mapKey = (check.mapKeys as any)[value];
            const display = mapKey ? (mapKey.startsWith("map") ? t(`capture.${mapKey}`) : mapKey) : value;
            return (
              <div key={check.key} className={`flex items-center gap-3 transition-all duration-500 ${i < visibleChecks ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0">
                  <span className="text-green-400 text-xs font-bold">✓</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground text-xs">{t(`capture.${check.labelKey}`)}:</span>
                  <span className="text-foreground text-sm font-semibold truncate">{display}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Email form */}
        <div className={`transition-all duration-700 relative mt-6 ${showForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="absolute -inset-4 -z-10 rounded-2xl overflow-hidden opacity-20 pointer-events-none pb-12 mix-blend-screen">
            <div className="w-full h-full bg-gradient-to-b from-primary/10 to-transparent blur-md"></div>
            <div className="absolute top-4 left-4 right-4 h-6 bg-primary/20 rounded blur-[2px]"></div>
            <div className="absolute top-14 left-4 w-1/2 h-4 bg-primary/10 rounded blur-[2px]"></div>
            <div className="absolute top-24 left-4 right-4 h-20 bg-primary/10 rounded blur-[3px]"></div>
            <div className="absolute top-48 left-4 right-4 h-8 bg-primary/20 rounded blur-[2px]"></div>
          </div>

          <div className="relative z-10 bg-background/60 backdrop-blur-xl border border-primary/30 rounded-2xl p-5 shadow-2xl shadow-primary/10 ring-2 ring-primary/20">
            <p className="text-xs lg:text-sm text-foreground font-bold text-center mb-1">{t("capture.formTitle")}</p>
            <p className="text-[11px] lg:text-sm text-muted-foreground text-center mb-4">
              {t("capture.formIncludes")} <span className="text-foreground font-semibold">{t("capture.formZones")}</span> · <span className="text-foreground font-semibold">{t("capture.formROI")}</span> · <span className="text-foreground font-semibold">{t("capture.formTax")}</span>
            </p>

            {!email && (
              <p className="text-center text-xs text-primary font-bold mb-2 animate-bounce">{t("capture.emailHint")}</p>
            )}

            <div className={`relative mb-4 rounded-xl transition-all duration-500 ${!email ? "shadow-[0_0_25px_rgba(13,89,242,0.35)] ring-2 ring-primary/40" : ""}`}>
              <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-primary/50 pointer-events-none z-10" size={18} />
              <input
                ref={emailRef}
                type="email"
                placeholder="nombre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3.5 rounded-xl text-foreground text-sm font-medium transition-all focus:outline-none bg-background/80 ${email.includes("@")
                  ? "border-2 border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/20"
                  : "border-2 border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/20 placeholder:text-muted-foreground/40"
                  }`}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className={`w-full py-4 rounded-xl font-black text-base lg:text-lg transition-all flex items-center justify-center gap-2 ${isValid
                ? "cta-gradient text-secondary-foreground hover-lift click-press shadow-[0_0_30px_rgba(255,140,0,0.4)] cta-pulse"
                : "bg-muted border border-border text-muted-foreground cursor-not-allowed opacity-60"
                }`}
            >
              <LockOpenIcon className="w-5 h-5 mb-0.5" size={20} />
              {t("capture.submitBtn")}
            </button>

            {/* Anti-spam guarantee with advisor photo */}
            <div className="mt-5 p-3 sm:p-4 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center sm:items-start gap-4">
              <img src={avatarJuan} alt="Juan Jaramillo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-secondary/40 shrink-0 shadow-[0_0_15px_rgba(255,140,0,0.15)]" />
              <div className="flex flex-col justify-center">
                <p className="text-[11px] sm:text-xs text-foreground font-bold">{t("capture.guaranteeQuote")}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-relaxed">{t("capture.guaranteeText")}</p>
                <p className="text-[9px] sm:text-[10px] text-secondary font-bold mt-1.5">{t("capture.guaranteeAuthor")}</p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-col items-center justify-center gap-2 mt-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-4 opacity-80">
                <div className="flex flex-col items-center gap-1">
                  <ShieldIcon className="w-4 h-4 text-muted-foreground" size={16} />
                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest text-center whitespace-pre-line">{t("capture.trustRERA")}</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex flex-col items-center gap-1">
                  <LockIcon className="w-4 h-4 text-muted-foreground" size={16} />
                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest text-center whitespace-pre-line">{t("capture.trustSSL")}</span>
                </div>
              </div>
              <p className="text-[8px] text-muted-foreground/60 text-center mt-1">{t("capture.trustAddress")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCaptureScreen;
```

### 3.6 Analytics Functions (booking-related)

```typescript
// From src/lib/analytics.ts — Fire-and-forget to Supabase quiz_events
export function track(event: string, screen?: number, data?: Record<string, any>): void {
  if (!supabase || !sessionId) return;
  supabase.from("quiz_events").insert({
    session_id: sessionId,
    event,
    screen: screen ?? null,
    data: data ?? {},
    ...utmParams,
  }).then(({ error }) => {
    if (error) console.error("[analytics]", event, error.message);
  });
}

// From src/lib/gtm.ts — GA4/GTM events
export const trackBookingStarted = () => pushToDataLayer("booking_started");

export const trackBookingCompleted = (date: string, time: string, profileType: string) => {
  pushToDataLayer("booking_completed", {
    booking_date: date,
    booking_time: time,
    investor_profile: profileType,
  });
};

export const trackScheduleConsultation = (profile: string) => {
  pushToDataLayer("schedule_consultation", { investor_profile: profile });
};
```

---

## 4. Edge Functions (Supabase/Deno)

### 4.1 ghl-slots — Free Slots Proxy

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * ghl-slots — Proxy for GHL free-slots API
 * GET /ghl-slots?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Returns: { slots: { "YYYY-MM-DD": ["HH:MM", ...] }, timezone: "Asia/Dubai" }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GHL_BASE = "https://services.leadconnectorhq.com";
const CALENDAR_ID = "eVRqVmkOERUGtMpjuEYT"; // ← CHANGE THIS
const TIMEZONE = "Asia/Dubai";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GHL_PIT_TOKEN = Deno.env.get("GHL_PIT_TOKEN")!;
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "startDate and endDate are required (YYYY-MM-DD)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // IMPORTANT: GHL API requires epoch milliseconds, not date strings
    const startEpoch = new Date(startDate + "T00:00:00").getTime();
    const endEpoch = new Date(endDate + "T23:59:59").getTime();

    const ghlUrl = `${GHL_BASE}/calendars/${CALENDAR_ID}/free-slots?startDate=${startEpoch}&endDate=${endEpoch}&timezone=${TIMEZONE}`;

    const ghlRes = await fetch(ghlUrl, {
      headers: {
        Authorization: `Bearer ${GHL_PIT_TOKEN}`,
        Version: "2021-07-28",
        Accept: "application/json",
      },
    });

    if (!ghlRes.ok) {
      const errText = await ghlRes.text();
      console.error(`[ghl-slots] GHL API error ${ghlRes.status}:`, errText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch availability", status: ghlRes.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ghlData = await ghlRes.json();

    // GHL returns: { "YYYY-MM-DD": { "slots": ["2026-02-25T08:00:00+04:00", ...] }, "traceId": "..." }
    const slots: Record<string, string[]> = {};

    for (const [dateKey, dayData] of Object.entries(ghlData)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
      const daySlots = (dayData as any)?.slots || [];
      slots[dateKey] = daySlots.map((slot: any) => {
        const slotStr = typeof slot === "string" ? slot : slot.start || slot.startTime || "";
        if (!slotStr) return null;
        const match = slotStr.match(/T(\d{2}:\d{2})/);
        if (match) return match[1];
        if (/^\d{2}:\d{2}$/.test(slotStr)) return slotStr;
        return null;
      }).filter(Boolean);
    }

    return new Response(
      JSON.stringify({ slots, timezone: TIMEZONE }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ghl-slots] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
```

### 4.2 ghl-book — Create Appointment

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * ghl-book — Create a GHL appointment and trigger confirmation flow.
 *
 * POST /ghl-book
 * Body: { name, email, phone?, startTime, endTime, profileType, budgetRange, zoneType, resultId? }
 *
 * Steps:
 * 1. Upsert contact in GHL → get contactId
 * 2. Create appointment via GHL Calendars API
 * 3. Call booking-handler?action=confirmation (server-to-server)
 * 4. Return { success, appointmentId }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GHL_BASE = "https://services.leadconnectorhq.com";
const CALENDAR_ID = "eVRqVmkOERUGtMpjuEYT"; // ← CHANGE THIS

interface BookingPayload {
  name: string;
  email: string;
  phone?: string;
  startTime: string;
  endTime: string;
  profileType?: string;
  budgetRange?: string;
  zoneType?: string;
  resultId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "POST only" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const GHL_PIT_TOKEN = Deno.env.get("GHL_PIT_TOKEN")!;
    const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const ghlHeaders = {
      Authorization: `Bearer ${GHL_PIT_TOKEN}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const payload: BookingPayload = await req.json();
    const { name, email, phone, startTime, endTime, profileType, budgetRange, zoneType, resultId } = payload;

    if (!name || !email || !startTime || !endTime) {
      return new Response(
        JSON.stringify({ error: "name, email, startTime, endTime are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 1: Upsert contact
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || "";

    const contactBody: Record<string, unknown> = {
      email, firstName, lastName,
      locationId: GHL_LOCATION_ID,
      source: "DXB Prime Quiz - Booking", // ← CHANGE THIS
    };
    if (phone) contactBody.phone = phone;

    const contactRes = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST", headers: ghlHeaders,
      body: JSON.stringify(contactBody),
    });

    const contactData = await contactRes.json();
    const contactId = contactData?.contact?.id;

    if (!contactId) {
      console.error("[ghl-book] Contact upsert failed:", JSON.stringify(contactData));
      return new Response(
        JSON.stringify({ error: "Contact upsert failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 2: Create appointment
    const appointmentBody = {
      calendarId: CALENDAR_ID,
      locationId: GHL_LOCATION_ID,
      contactId,
      startTime,
      endTime,
      title: `Sesión Estratégica — ${firstName}`, // ← CHANGE THIS
      appointmentStatus: "confirmed",
      address: "Videollamada (enlace por email)",
    };

    const apptRes = await fetch(`${GHL_BASE}/calendars/events/appointments`, {
      method: "POST", headers: ghlHeaders,
      body: JSON.stringify(appointmentBody),
    });

    const apptData = await apptRes.json();
    const appointmentId = apptData?.id || apptData?.event?.id || apptData?.appointment?.id;

    if (!apptRes.ok) {
      console.error("[ghl-book] Appointment creation failed:", JSON.stringify(apptData));
      return new Response(
        JSON.stringify({ error: "Appointment creation failed", details: apptData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 3: Trigger confirmation flow (non-blocking)
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/booking-handler?action=confirmation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId, contactName: name, contactEmail: email, contactPhone: phone || null,
          appointmentTime: startTime, profileType: profileType || "protector",
          budgetRange: budgetRange || "", zoneType: zoneType || "", resultId: resultId || null,
        }),
      });
    } catch (confirmErr) {
      console.error("[ghl-book] Confirmation call error (non-blocking):", confirmErr);
    }

    return new Response(
      JSON.stringify({ success: true, appointmentId: appointmentId || "created" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ghl-book] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
```

### 4.3 booking-handler — Confirmation + Reminders + No-Show

> This is the largest edge function (537 lines). It handles 3 actions:
> - `confirmation` — Send confirmation email + WhatsApp + calendar links + schedule reminders
> - `reminders` — Process due reminders (24h email, 24h WA, 2h WA, 15min WA, pre-value email, no-show check)
> - `noshow` — First no-show (WA + reschedule email + queue follow-ups) / Second no-show (farewell + close pipeline)

**Full code is at:** `supabase/functions/booking-handler/index.ts`

**Key patterns to copy:**

```typescript
// Email wrapper with branded header/footer
function wrapEmail(subject: string, body: string): string {
  return `<!DOCTYPE html><html lang="es">...
    <span style="...">DXB</span><span style="...">PRIME</span>  // ← CHANGE branding
    ...${body}...
    <p>© 2026 DXB Prime.</p>  // ← CHANGE
  `;
}

// Advisor signature block
function sig(): string {
  return `<table>
    <img src="${IMG_BASE}/avatar-juan.png" ... />  // ← CHANGE avatar URL
    <p>Juan Jaramillo</p>                          // ← CHANGE name
    <p>Senior Investment Advisor</p>               // ← CHANGE title
  </table>`;
}

// Calendar add links (Google, Outlook, Apple iCal)
const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${calStart}/${calEnd}&details=${calDetails}&location=${calLocation}`;
const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=...&startdt=...&enddt=...`;
const icsData = `data:text/calendar;charset=utf-8,${encodeURIComponent(`BEGIN:VCALENDAR\n...`)}`;

// Reminder scheduling via nurture_queue table
const reminders = [
  { type: "24h_email", send_at: new Date(apptTime - 24 * 3600_000).toISOString() },
  { type: "24h_wa",    send_at: new Date(apptTime - 24 * 3600_000).toISOString() },
  { type: "2h_wa",     send_at: new Date(apptTime - 2 * 3600_000).toISOString() },
  { type: "15min_wa",  send_at: new Date(apptTime - 15 * 60_000).toISOString() },
  { type: "noshow_check", send_at: new Date(apptTime + 30 * 60_000).toISOString() },
];
```

**Required Supabase secrets (set via `supabase secrets set`):**
```
GHL_PIT_TOKEN=pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GHL_LOCATION_ID=sPwaJjKJTs5y5rPTr4Py
GHL_PIPELINE_ID=your-pipeline-id
```

---

## 5. CSS Classes Needed

Add these to your `index.css` or Tailwind config:

```css
/* Gold/amber CTA gradient */
.cta-gradient {
  background: linear-gradient(135deg, #ff8c00, #ffa500, #ff4500);
}
.gold-cta-gradient {
  background: linear-gradient(135deg, #ff8c00, #ffa500, #ff4500);
}

/* Blue gradient */
.gold-gradient {
  background: linear-gradient(135deg, #0d59f2, #3a7ff5);
}

/* Glass morphism panels */
.glass-surface {
  background: rgba(26, 34, 50, 0.7);
  backdrop-filter: blur(40px) saturate(1.4);
  -webkit-backdrop-filter: blur(40px) saturate(1.4);
  border: 1px solid rgba(13, 89, 242, 0.15);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(13, 89, 242, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.glass-surface-strong {
  background: rgba(16, 22, 34, 0.85);
  backdrop-filter: blur(60px) saturate(1.6);
  -webkit-backdrop-filter: blur(60px) saturate(1.6);
  border: 1px solid rgba(13, 89, 242, 0.2);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.6),
    0 4px 16px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(13, 89, 242, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15);
}

/* Interaction utilities */
.hover-lift {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, border-color 0.25s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(13, 89, 242, 0.1);
}

.click-press:active {
  transform: scale(0.97);
  transition: transform 0.1s ease;
}

/* CTA pulse glow */
@keyframes cta-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 140, 0, 0.3), 0 0 40px rgba(255, 140, 0, 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 140, 0, 0.5), 0 0 60px rgba(255, 140, 0, 0.2), 0 0 80px rgba(255, 140, 0, 0.1);
  }
}
.cta-pulse {
  animation: cta-pulse 2s ease-in-out infinite;
}

/* Section reveal animation */
@keyframes section-reveal {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.section-reveal {
  opacity: 0;
  animation: section-reveal 0.6s ease-out forwards;
}

/* Scale-in for icons */
@keyframes animate-scale-in {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-in {
  animation: animate-scale-in 1.5s ease-out forwards;
}

/* Success pop for booking confirmation */
@keyframes success-pop {
  0% { transform: scale(0.6); opacity: 0; }
  50% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-success-pop {
  animation: success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Fade in + slide up */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out both;
}
```

---

## 6. Assets

| Asset | Path | Usage |
|-------|------|-------|
| Advisor avatar | `src/assets/avatar-juan.png` | BookingFlow, BookingPopup, AdvisorCTA, DataCapture |

---

## 7. Integration Checklist — What to Change

### IDs & Keys
- [ ] `GHL_CALENDAR_ID` in `constants.ts`, `ghl-slots`, `ghl-book`
- [ ] `GHL_LOCATION_ID` in Supabase secrets
- [ ] `GHL_PIT_TOKEN` in Supabase secrets
- [ ] `GHL_PIPELINE_ID` in Supabase secrets (optional, for CRM pipeline)
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`

### Branding
- [ ] Avatar image (`avatar-juan.png` → your advisor's photo)
- [ ] Advisor name ("Juan Jaramillo" → your name)
- [ ] Advisor title ("Senior Investment Advisor" → your title)
- [ ] WhatsApp URL (`WA_URL` in BookingFlow)
- [ ] Email branding in `wrapEmail()` and `sig()` (booking-handler)
- [ ] Email from address (`emailFrom: "Juan Jaramillo <juan@noddo.io>"`)
- [ ] Company/website URLs in email footer
- [ ] Instagram/social links in email signature

### Colors
- [ ] Primary: `#0d59f2` (blue) → your brand color
- [ ] CTA: `#ff8c00`/`#ffa500` (gold/amber) → your CTA color
- [ ] Background: `#101622` (navy) → your dark background
- [ ] Card: `#1a2232` → your card background

### Texts (i18n)
- [ ] All `t("booking.xxx")` and `t("advisor.xxx")` translation keys
- [ ] Appointment title in `ghl-book` ("Sesión Estratégica DXB Prime")
- [ ] Session duration (`SESSION_MINUTES = 15`)
- [ ] Country codes list (add/remove countries)

### Supabase Tables
- [ ] `quiz_events` table for analytics tracking
- [ ] `nurture_queue` table for reminder scheduling
  ```sql
  -- Key columns needed:
  contact_id TEXT, email TEXT, phone TEXT,
  lead_category TEXT, -- 'REMINDER' or 'NOSHOW'
  profile_type TEXT,
  next_send_at TIMESTAMPTZ,
  channel TEXT, -- 'email' or 'whatsapp'
  status TEXT, -- 'pending', 'sent', 'failed'
  first_name TEXT,
  timeline TEXT, -- reminder type: '24h_email', '2h_wa', etc.
  result_id TEXT,
  budget_range TEXT, zone_type TEXT
  ```

### Deploy Edge Functions
```bash
supabase functions deploy ghl-slots
supabase functions deploy ghl-book
supabase functions deploy booking-handler
supabase secrets set GHL_PIT_TOKEN=pit-xxx GHL_LOCATION_ID=xxx GHL_PIPELINE_ID=xxx
```
