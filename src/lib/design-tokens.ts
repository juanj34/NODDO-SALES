/**
 * NODDO Design Tokens
 *
 * Single source of truth for all visual properties across the platform.
 * These tokens enforce consistency and prevent "sancocho de diseño" fragmentation.
 *
 * CRITICAL RULES:
 * - ❌ NEVER use hardcoded values inline (text-[10px], gap-3, px-4)
 * - ✅ ALWAYS import from design-tokens or use atomic components
 * - ❌ NEVER duplicate className strings
 * - ✅ ALWAYS compose with cn() utility
 */

// ── Typography Scale ──────────────────────────────────────────────────
// Based on NODDO's unified font system: Syne (labels), Inter (body), DM Mono (numbers)

export const fontSize = {
  caption: "text-[9px]",     // Smallest labels, tags in tight spaces
  label: "text-[10px]",      // Form labels, card labels, section labels
  body: "text-[11px]",       // Body text, hints, descriptions
  subtitle: "text-[12px]",   // Subtitles, emphasized descriptions
  base: "text-[13px]",       // Default body size
  md: "text-sm",             // 14px - Larger body text
  heading: "text-lg",        // 18px - Section headings
  display: "text-2xl",       // 24px - Page titles
  hero: "text-3xl",          // 30px - Hero sections
} as const;

export const fontWeight = {
  light: "font-light",       // 300 - DM Mono body, Cormorant display
  normal: "font-normal",     // 400 - Inter body
  medium: "font-medium",     // 500 - Emphasis
  semibold: "font-semibold", // 600 - Syne labels
  bold: "font-bold",         // 700 - Syne buttons, strong labels
  extrabold: "font-extrabold", // 800 - Heavy emphasis
} as const;

export const letterSpacing = {
  tight: "tracking-tight",   // -0.025em
  normal: "tracking-normal", // 0
  wide: "tracking-wide",     // 0.025em
  wider: "tracking-wider",   // 0.05em - Syne labels default
  widest: "tracking-widest", // 0.1em - Buttons, badges
} as const;

export const lineHeight = {
  none: "leading-none",      // 1
  tight: "leading-tight",    // 1.25
  snug: "leading-snug",      // 1.375
  normal: "leading-normal",  // 1.5
  relaxed: "leading-relaxed", // 1.625
  loose: "leading-loose",    // 2
} as const;

// ── Spacing Scale (4px base) ──────────────────────────────────────────
// Tailwind's default spacing scale - use semantic names in components

export const spacing = {
  none: "0",        // 0px
  xs: "1",          // 4px
  sm: "2",          // 8px
  md: "3",          // 12px
  lg: "4",          // 16px
  xl: "5",          // 20px
  "2xl": "6",       // 24px
  "3xl": "8",       // 32px
  "4xl": "10",      // 40px
  "5xl": "12",      // 48px
} as const;

// ── Semantic Gap (for flex/grid layouts) ──────────────────────────────

export const gap = {
  compact: "gap-1",    // 4px - Tight layouts (badges, inline elements)
  normal: "gap-2",     // 8px - Default spacing
  relaxed: "gap-3",    // 12px - Cards, form fields
  loose: "gap-4",      // 16px - Sections, page layout
  spacious: "gap-6",   // 24px - Between major sections
} as const;

// ── Semantic Padding (for buttons, cards, inputs) ─────────────────────

export const padding = {
  compact: "px-2 py-1",        // Badges, small tags
  normal: "px-3 py-2",         // Buttons, small cards
  comfortable: "px-4 py-3",    // Default cards, inputs
  spacious: "px-6 py-4",       // Large cards, modals
  generous: "px-8 py-6",       // Hero sections, major containers
} as const;

// ── Border Radius ─────────────────────────────────────────────────────

export const radius = {
  none: "rounded-none",
  sm: "rounded-[0.625rem]",    // 10px - Inputs, small elements
  md: "rounded-[0.75rem]",     // 12px - Buttons
  lg: "rounded-xl",            // 16px - Small cards
  xl: "rounded-[1.25rem]",     // 20px - Large cards, modals
  "2xl": "rounded-2xl",        // 24px - Feature sections
  full: "rounded-full",        // Pills, avatars, dots
} as const;

// ── Icon Sizes (in pixels - for Lucide React) ────────────────────────

export const iconSize = {
  xs: 12,      // Inline icons, badges (very rare)
  sm: 14,      // Labels, small buttons
  md: 16,      // Default buttons, inputs, table icons
  lg: 20,      // Section headers, emphasis
  xl: 24,      // Feature icons, page headers
  "2xl": 32,   // Empty states, illustrations
  "3xl": 48,   // Hero sections, large features
  "4xl": 64,   // Dashboard shortcuts, major icons
} as const;

// ── Icon Colors (semantic - using CSS variables) ──────────────────────

export const iconColor = {
  primary: "text-[var(--site-primary)]",           // Gold accent
  secondary: "text-[var(--text-secondary)]",       // White 55%
  tertiary: "text-[var(--text-tertiary)]",         // White 35%
  muted: "text-[var(--text-muted)]",               // White 18%
  white: "text-white",                             // Pure white
  dark: "text-[#141414]",                          // Dark text (on gold backgrounds)
  success: "text-green-400",                       // Success states
  warning: "text-amber-400",                       // Warning states
  error: "text-red-400",                           // Error states
  info: "text-blue-400",                           // Info states
} as const;

// ── Border Widths ─────────────────────────────────────────────────────

export const borderWidth = {
  none: "border-0",
  thin: "border",              // 1px - Default
  medium: "border-2",          // 2px - Emphasis
  thick: "border-4",           // 4px - Strong emphasis
} as const;

// ── Shadows (using CSS custom properties) ─────────────────────────────

export const shadow = {
  sm: "shadow-[var(--shadow-sm)]",       // Subtle depth
  md: "shadow-[var(--shadow-md)]",       // Card elevation
  lg: "shadow-[var(--shadow-lg)]",       // Modal, drawer
  xl: "shadow-[var(--shadow-xl)]",       // Major elevation
  "2xl": "shadow-[var(--shadow-2xl)]",   // Maximum elevation
  none: "shadow-none",
} as const;

// ── Glow Effects (using CSS custom properties) ────────────────────────

export const glow = {
  sm: "shadow-[var(--glow-sm)]",         // Subtle accent glow
  md: "shadow-[var(--glow-md)]",         // Default accent glow
  lg: "shadow-[var(--glow-lg)]",         // Strong accent glow
  none: "shadow-none",
} as const;

// ── Transitions ───────────────────────────────────────────────────────

export const transition = {
  none: "transition-none",
  fast: "transition-all duration-150",       // 150ms - Quick interactions
  base: "transition-all duration-200",       // 200ms - Default
  smooth: "transition-all duration-300",     // 300ms - Smooth animations
  slow: "transition-all duration-500",       // 500ms - Deliberate animations
} as const;

// ── Z-Index Scale ─────────────────────────────────────────────────────

export const zIndex = {
  base: "z-0",
  dropdown: "z-10",
  sticky: "z-20",
  fixed: "z-30",
  modalBackdrop: "z-40",
  modal: "z-50",
  popover: "z-60",
  tooltip: "z-70",
} as const;

// ── Opacity Scale ─────────────────────────────────────────────────────

export const opacity = {
  none: "opacity-0",
  subtle: "opacity-[0.18]",      // Muted text level
  light: "opacity-[0.35]",       // Tertiary text level
  medium: "opacity-[0.55]",      // Secondary text level
  high: "opacity-[0.92]",        // Primary text level
  full: "opacity-100",
} as const;

// ── Type Guards & Utilities ───────────────────────────────────────────

export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LetterSpacing = keyof typeof letterSpacing;
export type LineHeight = keyof typeof lineHeight;
export type Spacing = keyof typeof spacing;
export type Gap = keyof typeof gap;
export type Padding = keyof typeof padding;
export type Radius = keyof typeof radius;
export type IconSize = keyof typeof iconSize;
export type IconColor = keyof typeof iconColor;
export type BorderWidth = keyof typeof borderWidth;
export type Shadow = keyof typeof shadow;
export type Glow = keyof typeof glow;
export type Transition = keyof typeof transition;
export type ZIndex = keyof typeof zIndex;
export type Opacity = keyof typeof opacity;
