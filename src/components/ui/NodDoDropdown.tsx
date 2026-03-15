"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

// Types
type Variant = "dashboard" | "marketing" | "site" | "table";
type Size = "sm" | "md" | "lg";

export interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  metadata?: Record<string, unknown>;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  variant?: Variant;
  size?: Size;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  renderOption?: (option: Option, isSelected: boolean) => React.ReactNode;
  renderSelected?: (option: Option) => React.ReactNode;
  className?: string;
}

// Styling configurations
const variantStyles = {
  dashboard: {
    trigger: "bg-[var(--surface-3)] border-[var(--border-default)] hover:border-[var(--border-strong)]",
    triggerOpen: "border-[rgba(184,151,58,0.4)] shadow-[0_0_0_3px_rgba(184,151,58,0.08)]",
    triggerText: "text-[var(--text-secondary)]",
    triggerTextPlaceholder: "text-[var(--text-muted)]",
    panel: "bg-[rgba(26,26,29,0.95)] border-[var(--border-default)]",
    optionSelected: "bg-[rgba(184,151,58,0.12)] text-[var(--site-primary)]",
    optionHover: "hover:bg-[var(--surface-3)] hover:text-white",
    optionText: "text-[var(--text-secondary)]",
  },
  marketing: {
    trigger: "border hover:border-[rgba(255,255,255,0.12)]",
    triggerOpen: "border-[rgba(184,151,58,0.4)] shadow-[0_0_0_3px_rgba(184,151,58,0.08)]",
    triggerText: "text-[rgba(244,240,232,0.9)]",
    triggerTextPlaceholder: "text-[rgba(244,240,232,0.4)]",
    panel: "bg-[rgba(26,26,29,0.95)] border-[rgba(255,255,255,0.08)]",
    optionSelected: "bg-[rgba(184,151,58,0.12)] text-[#b8973a]",
    optionHover: "hover:bg-[rgba(255,255,255,0.05)] hover:text-[rgba(244,240,232,1)]",
    optionText: "text-[rgba(244,240,232,0.7)]",
  },
  site: {
    trigger: "bg-[var(--surface-3)] border-[var(--border-default)] hover:border-[var(--border-strong)]",
    triggerOpen: "border-[var(--site-primary)] shadow-[0_0_0_3px_rgba(var(--site-primary-rgb),0.08)]",
    triggerText: "text-[var(--text-secondary)]",
    triggerTextPlaceholder: "text-[var(--text-muted)]",
    panel: "bg-[rgba(26,26,29,0.95)] border-[var(--border-default)]",
    optionSelected: "bg-[rgba(var(--site-primary-rgb),0.12)] text-[var(--site-primary)]",
    optionHover: "hover:bg-[var(--surface-3)] hover:text-white",
    optionText: "text-[var(--text-secondary)]",
  },
  table: {
    trigger: "bg-transparent border-[var(--border-default)] hover:border-[var(--border-strong)]",
    triggerOpen: "border-[rgba(184,151,58,0.4)]",
    triggerText: "text-white",
    triggerTextPlaceholder: "text-[var(--text-muted)]",
    panel: "bg-[rgba(26,26,29,0.95)] border-[var(--border-default)]",
    optionSelected: "bg-[rgba(184,151,58,0.12)] text-[var(--site-primary)]",
    optionHover: "hover:bg-[var(--surface-3)] hover:text-white",
    optionText: "text-[var(--text-secondary)]",
  },
};

const sizeStyles = {
  sm: {
    trigger: "px-2 py-1.5 text-[10px] gap-1.5",
    chevron: 10,
    option: "px-2.5 py-2 text-[10px]",
    check: 10,
  },
  md: {
    trigger: "px-3 py-2 text-[11px] gap-2",
    chevron: 12,
    option: "px-3 py-2.5 text-[11px]",
    check: 12,
  },
  lg: {
    trigger: "px-4 py-2.5 text-[13px] gap-2",
    chevron: 14,
    option: "px-4 py-3 text-[13px]",
    check: 14,
  },
};

export function NodDoDropdown({
  value,
  onChange,
  options,
  variant = "dashboard",
  size = "md",
  placeholder,
  icon,
  disabled = false,
  error,
  renderOption,
  renderSelected,
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const vStyles = variantStyles[variant];
  const szStyles = sizeStyles[size];

  // Inline styles for marketing variant (special case)
  const marketingTriggerStyle = variant === "marketing" ? {
    background: "rgba(255,255,255,0.04)",
    borderColor: isOpen ? "rgba(184,151,58,0.4)" : "rgba(255,255,255,0.08)",
  } : undefined;

  // Handler functions - defined before effects that use them
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          setIsOpen(false);
          setFocusedIndex(-1);
          triggerRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0) {
            handleSelect(options[focusedIndex].value);
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(options.length - 1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSelect is stable, defined before this effect
  }, [isOpen, focusedIndex, options]);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && panelRef.current) {
      const focusedElement = panelRef.current.children[0]?.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex, isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Set focused index to current selection when opening
        const selectedIndex = options.findIndex((opt) => opt.value === value);
        setFocusedIndex(selectedIndex >= 0 ? selectedIndex : -1);
      }
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="noddo-dropdown-panel"
        aria-label={placeholder || "Select option"}
        className={`
          group relative w-full flex items-center rounded-[0.625rem]
          border transition-all font-ui font-bold uppercase tracking-[0.08em]
          ${szStyles.trigger}
          ${isOpen ? vStyles.triggerOpen : vStyles.trigger}
          ${!selectedOption ? vStyles.triggerTextPlaceholder : vStyles.triggerText}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${error ? "border-red-500/40" : ""}
        `}
        style={marketingTriggerStyle}
      >
        {/* Icon */}
        {icon && (
          <span className="shrink-0 opacity-60">
            {icon}
          </span>
        )}

        {/* Selected label or placeholder */}
        <span className="flex-1 text-left truncate">
          {selectedOption
            ? renderSelected
              ? renderSelected(selectedOption)
              : selectedOption.label
            : placeholder || "Seleccionar..."}
        </span>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
        >
          <ChevronDown size={szStyles.chevron} />
        </motion.div>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-[10px] text-red-400">{error}</p>
      )}

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            id="noddo-dropdown-panel"
            role="listbox"
            className={`
              absolute z-50 top-[calc(100%+6px)] left-0 w-full min-w-[160px]
              overflow-hidden rounded-[0.75rem]
              shadow-[0_8px_40px_rgba(0,0,0,0.5)]
              ${vStyles.panel}
            `}
            style={{
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              willChange: "transform, opacity",
            }}
          >
            <div className="py-1 max-h-[240px] overflow-y-auto noddo-dropdown-panel">
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isFocused = index === focusedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`
                      w-full flex items-center transition-all font-mono text-left
                      ${szStyles.option}
                      ${isSelected ? vStyles.optionSelected : `${vStyles.optionText} ${vStyles.optionHover}`}
                      ${isFocused && !isSelected ? "bg-[var(--surface-2)]" : ""}
                    `}
                  >
                    {/* Check icon for selected */}
                    <span className="w-3 shrink-0">
                      {isSelected && <Check size={szStyles.check} className="text-[var(--site-primary)]" />}
                    </span>

                    {/* Option content */}
                    <span className="flex-1 truncate">
                      {renderOption ? renderOption(option, isSelected) : option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
