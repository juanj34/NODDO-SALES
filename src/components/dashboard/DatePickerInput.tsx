"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { parseDateStr, formatDateDisplay } from "@/lib/cotizador/payment-rows";

/* ── Spanish locale ── */
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAYS_SHORT = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

/* ── Helpers ── */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Monday = 0, Sunday = 6 */
function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ── Props ── */
interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Compact mode for inline table cells — no icon, transparent bg, trailing calendar button */
  compact?: boolean;
  disabled?: boolean;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  compact = false,
  disabled = false,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  const today = useRef(new Date()).current;
  const selected = parseDateStr(value);

  const [viewYear, setViewYear] = useState(() => (selected ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected ?? today).getMonth());

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Position the portal panel ── */
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelH = 320;
    const panelW = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldDropUp = spaceBelow < panelH && rect.top > panelH;
    setDropUp(shouldDropUp);

    // Horizontal: try left-aligned, shift left if overflowing
    let left = rect.left;
    if (left + panelW > window.innerWidth - 8) {
      left = Math.max(8, rect.right - panelW);
    }

    setPanelPos({
      top: shouldDropUp ? rect.top - 6 : rect.bottom + 6,
      left,
    });
  }, []);

  /* ── Open handler ── */
  const handleOpen = useCallback(() => {
    if (disabled) return;
    const sel = parseDateStr(value);
    const ref = sel ?? today;
    setViewYear(ref.getFullYear());
    setViewMonth(ref.getMonth());
    setOpen(true);
  }, [value, today, disabled]);

  /* ── Reposition on scroll/resize ── */
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  /* ── Close on click outside ── */
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* ── Close on Escape ── */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  /* ── Month navigation ── */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  /* ── Select a day ── */
  const handleSelect = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    onChange(formatDateDisplay(date));
    setOpen(false);
    inputRef.current?.focus();
  };

  /* ── Go to today ── */
  const handleToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    handleSelect(today.getDate());
  };

  /* ── Build calendar grid ── */
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
  );

  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false });

  /* ── Portal panel ── */
  const calendarPanel = open && panelPos && createPortal(
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: dropUp ? 6 : -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: dropUp ? 6 : -6, scale: 0.97 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        className="fixed z-[9999] w-[280px] rounded-xl border border-[var(--border-default)] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
        style={{
          top: dropUp ? undefined : panelPos.top,
          bottom: dropUp ? window.innerHeight - panelPos.top : undefined,
          left: panelPos.left,
          background: "rgba(26,26,29,0.96)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          willChange: "transform, opacity",
        }}
      >
        {/* Header: month/year + arrows */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-md hover:bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-[var(--text-primary)] select-none">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-md hover:bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {DAYS_SHORT.map((d) => (
            <div key={d} className="text-center text-[8px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 px-2 pb-2">
          {cells.map((cell, i) => {
            const cellDate = new Date(viewYear, viewMonth, cell.day);
            const isToday = cell.current && isSameDay(cellDate, today);
            const isSelected = cell.current && selected && isSameDay(cellDate, selected);

            return (
              <button
                key={i}
                type="button"
                disabled={!cell.current}
                onClick={() => cell.current && handleSelect(cell.day)}
                className={cn(
                  "relative h-8 w-full rounded-md text-[11px] font-mono transition-colors",
                  !cell.current && "text-[var(--text-muted)] opacity-30 cursor-default",
                  cell.current && !isSelected && "text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white cursor-pointer",
                  isSelected && "bg-[rgba(var(--site-primary-rgb),0.2)] text-[var(--site-primary)] font-medium ring-1 ring-[rgba(var(--site-primary-rgb),0.4)]",
                  isToday && !isSelected && "text-[var(--site-primary)]",
                )}
              >
                {cell.day}
                {isToday && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--site-primary)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick: Today */}
        <div className="px-2 pb-2 border-t border-[var(--border-subtle)] pt-1.5">
          <button
            type="button"
            onClick={handleToday}
            className="w-full py-1.5 rounded-md text-[10px] font-ui font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors"
          >
            Hoy
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );

  /* ── Compact mode (table row inline) ── */
  if (compact) {
    return (
      <>
        <div ref={triggerRef} className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="bg-transparent text-xs text-[var(--text-secondary)] font-mono focus:outline-none placeholder:text-[var(--text-muted)] border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)] min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={handleOpen}
            disabled={disabled}
            className="shrink-0 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors"
          >
            <Calendar size={11} />
          </button>
        </div>
        {calendarPanel}
      </>
    );
  }

  /* ── Default mode (standalone input with icon) ── */
  return (
    <>
      <div ref={triggerRef} className="relative">
        <Calendar
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleOpen}
          placeholder={placeholder}
          disabled={disabled}
          className="input-glass w-full pl-10 text-xs font-mono"
        />
      </div>
      {calendarPanel}
    </>
  );
}
