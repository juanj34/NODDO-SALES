/** ─── NODDO GoHighLevel Booking Configuration ─── */

/** GHL Calendar ID — replace with your NODDO calendar ID from GHL dashboard */
export const GHL_CALENDAR_ID = "YOUR_NODDO_CALENDAR_ID";

/** Calendar timezone (used for slot conversion) */
export const GHL_CALENDAR_TZ = "America/Bogota";

/** GHL booking widget fallback URL */
export const GHL_BOOKING_URL = `https://msgsndr.com/widget/booking?calendar=${GHL_CALENDAR_ID}`;

/** Supabase Edge Functions base URL */
export const SUPABASE_FN_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

/** Demo session duration in minutes */
export const SESSION_MINUTES = 30;

/** Max time slots to display per day */
export const MAX_DISPLAY_SLOTS = 5;

/** NODDO WhatsApp fallback URL */
export const NODDO_WA_URL =
  "https://wa.me/573001234567?text=Hola,%20quiero%20agendar%20una%20demo%20de%20NODDO";

/** Country codes — LATAM first */
export const COUNTRY_CODES = [
  { code: "+57", flag: "🇨🇴" },
  { code: "+52", flag: "🇲🇽" },
  { code: "+54", flag: "🇦🇷" },
  { code: "+56", flag: "🇨🇱" },
  { code: "+51", flag: "🇵🇪" },
  { code: "+593", flag: "🇪🇨" },
  { code: "+507", flag: "🇵🇦" },
  { code: "+1", flag: "🇺🇸" },
  { code: "+34", flag: "🇪🇸" },
  { code: "+55", flag: "🇧🇷" },
];

/** Month names */
export const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Full day names */
export const LONG_DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const LONG_DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─── Timezone Helpers ───────────────────────────────────────────────────

/** Convert a date+time in the calendar timezone to the client's local timezone */
export function calendarTzToLocal(
  calDate: string,
  calTime: string,
  clientTz: string,
) {
  // Resolve the calendar timezone offset dynamically
  const instant = new Date(`${calDate}T${calTime}:00`);
  // Format in calendar TZ to get the correct UTC instant
  const calendarOffset = getTimezoneOffsetString(GHL_CALENDAR_TZ, instant);
  const correctedInstant = new Date(`${calDate}T${calTime}:00${calendarOffset}`);

  const localTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: clientTz,
  }).format(correctedInstant);
  const localDate = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: clientTz,
  }).format(correctedInstant);
  return { localDate, localTime };
}

/** Get today's date string in the calendar timezone */
export function todayInCalendarTz(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GHL_CALENDAR_TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

/** Get a human-readable GMT offset label for a timezone */
export function getGmtLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: tz, timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || tz;
  } catch {
    return tz;
  }
}

/** Format a date string as a long readable date */
export function formatDateLong(dateStr: string, lang: string): string {
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

/** Get the timezone offset string (e.g., "-05:00") for a given timezone at a given instant */
function getTimezoneOffsetString(tz: string, date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: tz, timeZoneName: "longOffset",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    // Returns something like "GMT-05:00" — extract the offset part
    const match = tzPart?.value?.match(/GMT([+-]\d{2}:\d{2})/);
    if (match) return match[1];
    // If GMT+0, the format might just be "GMT"
    if (tzPart?.value === "GMT") return "+00:00";
    return "+00:00";
  } catch {
    return "+00:00";
  }
}
