"use client";

import { useState, useCallback, useRef } from "react";
import { CURRENCY_CONFIG } from "@/lib/currency";
import type { Currency } from "@/types";

interface CurrencyInputProps {
  /** Raw numeric value (or empty string for null) */
  value: string | number;
  /** Called with the raw string value (digits only) */
  onChange: (value: string) => void;
  /** Currency code — determines symbol and locale formatting */
  currency?: Currency;
  /** Placeholder shown when empty */
  placeholder?: string;
  /** Additional className for the wrapper */
  className?: string;
  /** Additional className for the input element */
  inputClassName?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
}

/**
 * Format a numeric string with thousand separators for a given currency locale.
 * Returns empty string for empty/invalid input.
 */
function formatDisplay(raw: string | number, currency: Currency): string {
  const str = String(raw).replace(/[^\d]/g, "");
  if (!str) return "";
  const num = parseInt(str, 10);
  if (isNaN(num)) return "";
  const config = CURRENCY_CONFIG[currency];
  return new Intl.NumberFormat(config.locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Currency-aware input that shows formatted values (symbol + thousand separators)
 * while editing, and stores/emits raw numeric strings.
 */
export function CurrencyInput({
  value,
  onChange,
  currency = "COP",
  placeholder,
  className,
  inputClassName,
  disabled,
}: CurrencyInputProps) {
  const config = CURRENCY_CONFIG[currency];
  const inputRef = useRef<HTMLInputElement>(null);

  // We keep an internal display string that includes separators
  const rawStr = String(value ?? "").replace(/[^\d]/g, "");
  const [isFocused, setIsFocused] = useState(false);
  const [localDisplay, setLocalDisplay] = useState("");

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // On focus, show the formatted number (without symbol) for easier editing
    setLocalDisplay(formatDisplay(value, currency));
  }, [value, currency]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      // Strip everything except digits
      const digits = input.replace(/[^\d]/g, "");
      // Update parent with raw digits
      onChange(digits);
      // Show formatted in the input
      setLocalDisplay(formatDisplay(digits, currency));
    },
    [onChange, currency]
  );

  const displayValue = isFocused
    ? localDisplay
    : formatDisplay(value, currency);

  const formattedPlaceholder = placeholder
    ? `${config.symbol} ${placeholder}`
    : `${config.symbol} 0`;

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Currency symbol prefix */}
      {(displayValue || isFocused) && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none select-none">
          {config.symbol}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={formattedPlaceholder}
        disabled={disabled}
        className={`${inputClassName ?? ""} ${displayValue || isFocused ? "pl-8" : ""} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
    </div>
  );
}
