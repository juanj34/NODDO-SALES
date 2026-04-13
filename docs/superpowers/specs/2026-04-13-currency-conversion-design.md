# Currency Conversion — Microsite Full Integration

**Date:** 2026-04-13
**Status:** Approved

## Problem

1. **Settings panel auto-closes**: The Settings button in `SiteNav.tsx` uses `onBlur` with a 150ms timeout. When the `NodDoDropdown` (CurrencySelector) opens its portal panel on `document.body`, focus leaves the settings button, closing the entire panel before the user can select a currency.
2. **Prices never convert**: All microsite pages call `formatCurrency(price, proyecto.moneda_base)` directly. The `convertPrice()` function from `useCurrency()` is never used, so changing currency has zero effect on displayed prices.

## Solution: Enfoque A — `useSiteFormatCurrency` hook

### 1. Fix Settings Panel Auto-Close

**File:** `src/components/site/SiteNav.tsx`

**Change:** Replace the `onBlur={() => setTimeout(() => setShowSettings(false), 150)}` on the Settings button with a proper click-outside handler using `useRef` + `mousedown` event listener.

The handler must check that the click target is:
- Outside the settings button
- Outside the settings panel
- Outside any portal-rendered dropdown (identified by the `#noddo-dropdown-panel` element or `data-noddo-dropdown-portal` attribute)

This allows the `NodDoDropdown` portal to receive clicks without the settings panel closing.

### 2. New Hook: `useSiteFormatCurrency`

**File:** `src/hooks/useSiteFormatCurrency.ts`

```ts
export function useSiteFormatCurrency(): (amount: number, options?: FormatOptions) => string
```

Internals:
1. Calls `useCurrency()` to get `displayCurrency`, `convertPrice`, `baseCurrency`
2. Converts: `convertPrice(amount)` — base currency → display currency using cached exchange rates
3. Formats: `formatCurrency(convertedAmount, displayCurrency, options)` — proper locale, symbol, decimals
4. Returns the formatted string

Also exports:
- `displayCurrency` — current display currency code
- `baseCurrency` — project's base currency
- `isConverted` — boolean (`displayCurrency !== baseCurrency`) for showing approximation notices

### 3. Wire Conversion Into All Microsite Price Displays

Every `formatCurrency(price, proyecto.moneda_base ?? "COP")` call on the microsite becomes `siteFormat(price)`.

| File | ~Calls | Notes |
|---|---|---|
| `src/app/sites/[slug]/tipologias/page.tsx` | 11 | precio_desde, terreno, construccion, total, range displays |
| `src/app/sites/[slug]/inventario/page.tsx` | 8 | unit prices, typology precio_desde, spec ranges |
| `src/components/site/CotizadorFlowMultiStep.tsx` | 8 | unit price, terreno, construccion, cuotas, monto_total, precio_neto |
| `src/components/site/CotizadorModal.tsx` | 1 | typology precio_desde in selector |

### 4. Approximation Indicator

When `isConverted` is true (display currency differs from base), show a subtle notice near price displays:

- Small text badge: "Precios aproximados en {CURRENCY}" — appears once per page section, not per price
- Uses `text-[var(--text-muted)]` styling, `font-mono text-[10px]`
- Positioned near the first price in each major section (e.g., top of inventory table, top of tipologías panel)

### 5. What Does NOT Change

- `/api/exchange-rates` endpoint — already functional with ExchangeRate-API.io
- `CurrencyContext` and localStorage caching — already handles 24h rate caching
- Cron job (`/api/exchange-rates/cron`) — already configured for daily refresh
- `CurrencySelector` component — works correctly, just needs the parent panel fix
- Dashboard editor — stays in base currency (COP/USD/etc.), no conversion
- `NodDoDropdown` component — no changes needed

## Architecture

```
User clicks Settings → Panel opens
  → User opens CurrencySelector dropdown (portal)
  → Click-outside handler ignores portal clicks ✓
  → User selects "USD"
  → CurrencyContext updates displayCurrency
  → localStorage persists choice per project
  → All useSiteFormatCurrency consumers re-render
  → convertPrice(amount) converts base→USD using cached rates
  → formatCurrency(converted, "USD") formats with $ symbol
  → Prices update across all microsite pages
```

## Edge Cases

- **No exchange rates available**: `convertPrice()` returns original amount (rate=1 fallback already exists in `convertCurrency`). Prices show in base currency.
- **Same currency selected**: `convertPrice()` short-circuits (returns original). No approximation badge shown.
- **Rate staleness**: Rates cached for 24h in localStorage + Supabase. The "Updated X ago" timestamp in CurrencySelector already communicates freshness.
- **Cotizador calculations**: The cotizador computes payment plans server-side in base currency. `siteFormat()` converts the final display values only — calculation logic untouched.
