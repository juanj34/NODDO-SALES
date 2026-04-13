# Currency Conversion — Microsite Full Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the currency switcher on microsites actually work — fix the auto-closing panel, create a formatting hook that converts prices, and wire it into every price display across tipologías, inventario, and cotizador.

**Architecture:** A new `useSiteFormatCurrency` hook wraps `useCurrency().convertPrice()` + `formatCurrency()` into a single call. Every `formatCurrency(price, proyecto.moneda_base)` on the microsite becomes `siteFormat(price)`. The settings panel's `onBlur` is replaced with a click-outside handler that respects portals.

**Tech Stack:** React hooks, CurrencyContext (existing), formatCurrency (existing), Framer Motion

---

### Task 1: Fix Settings Panel Auto-Close in SiteNav

**Files:**
- Modify: `src/components/site/SiteNav.tsx:58` (add `useRef`), `:275-296` (replace onBlur with click-outside)

- [ ] **Step 1: Add refs and click-outside effect for the settings panel**

In `SiteNav.tsx`, add a ref for the settings panel wrapper and replace the `onBlur` approach with a `mousedown` click-outside listener.

At the top of `SiteNav` function (line ~58), the component already imports `useState`. Add `useRef` and `useEffect` to the existing React import:

```tsx
import { useState, useRef, useEffect } from "react";
```

Inside the `SiteNav` component body, after the existing state declarations (~line 65), add a ref:

```tsx
const settingsPanelRef = useRef<HTMLDivElement>(null);
```

Add this effect after the ref:

```tsx
// Close settings panel on click-outside (respects portal-rendered dropdowns)
useEffect(() => {
  if (!showSettings) return;

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Node;

    // Don't close if clicking inside the settings panel wrapper
    if (settingsPanelRef.current?.contains(target)) return;

    // Don't close if clicking inside a portal-rendered dropdown panel
    const portalPanel = document.getElementById("noddo-dropdown-panel");
    if (portalPanel?.contains(target)) return;

    setShowSettings(false);
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [showSettings]);
```

- [ ] **Step 2: Attach ref and remove onBlur from the settings button**

Change the settings `<div className="relative">` wrapper (line ~275) to use the ref:

Replace:
```tsx
<div className="relative">
```
With:
```tsx
<div className="relative" ref={settingsPanelRef}>
```

Remove the `onBlur` from the settings button (line ~278). Change:

```tsx
onBlur={() => setTimeout(() => setShowSettings(false), 150)}
```

Remove that line entirely. The button should keep `onClick={() => setShowSettings(!showSettings)}` — no `onBlur`.

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`

Navigate to a microsite (e.g., `http://localhost:3000/sites/demo/tipologias`).

1. Click the Settings gear icon in the sidebar footer
2. The settings panel should open and stay open
3. Click the currency dropdown inside the panel
4. The dropdown portal should open WITHOUT the settings panel closing
5. Select a different currency — it should update
6. Click outside the settings panel — it should close
7. Click outside the dropdown while it's open — the dropdown should close

- [ ] **Step 4: Commit**

```bash
git add src/components/site/SiteNav.tsx
git commit -m "fix: settings panel no longer auto-closes when interacting with dropdown portals"
```

---

### Task 2: Create `useSiteFormatCurrency` Hook

**Files:**
- Create: `src/hooks/useSiteFormatCurrency.ts`

- [ ] **Step 1: Create the hook file**

Create `src/hooks/useSiteFormatCurrency.ts`:

```tsx
"use client";

import { useCallback } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";

/**
 * Hook for microsite pages to format prices with automatic currency conversion.
 *
 * Converts from the project's base currency to the visitor's selected display currency
 * using cached exchange rates, then formats with the correct locale/symbol.
 *
 * @example
 * const { siteFormat, isConverted, displayCurrency } = useSiteFormatCurrency();
 * return <p>{siteFormat(500000)}</p>; // "$119 USD" or "$500,000 COP"
 */
export function useSiteFormatCurrency() {
  const { displayCurrency, baseCurrency, convertPrice } = useCurrency();

  const isConverted = displayCurrency !== baseCurrency;

  const siteFormat = useCallback(
    (amount: number, options?: { compact?: boolean; decimalPlaces?: number }) => {
      const converted = convertPrice(amount);
      return formatCurrency(converted, displayCurrency, options);
    },
    [convertPrice, displayCurrency]
  );

  return { siteFormat, isConverted, displayCurrency, baseCurrency };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors related to `useSiteFormatCurrency.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSiteFormatCurrency.ts
git commit -m "feat: add useSiteFormatCurrency hook for microsite price conversion"
```

---

### Task 3: Wire Currency Conversion into Tipologías Page

**Files:**
- Modify: `src/app/sites/[slug]/tipologias/page.tsx`

- [ ] **Step 1: Replace import and add hook call**

In `src/app/sites/[slug]/tipologias/page.tsx`:

Replace the import:
```tsx
import { formatCurrency } from "@/lib/currency";
```
With:
```tsx
import { useSiteFormatCurrency } from "@/hooks/useSiteFormatCurrency";
```

Inside `TipologiasPage()`, after the existing hook calls at the top of the component (after `useSectionVisibility`, `useSiteProject`, etc.), add:

```tsx
const { siteFormat, isConverted, displayCurrency } = useSiteFormatCurrency();
```

- [ ] **Step 2: Replace all `formatCurrency` calls**

Replace every instance of `formatCurrency(..., proyecto.moneda_base ?? "COP")` with `siteFormat(...)`. There are 11 calls:

1. Line ~916: `formatCurrency(active.precio_desde, proyecto.moneda_base ?? "COP")` → `siteFormat(active.precio_desde)`
2. Line ~937: `formatCurrency(total, proyecto.moneda_base ?? "COP")` → `siteFormat(total)`
3. Line ~939: `formatCurrency(construccion, proyecto.moneda_base ?? "COP")` → `siteFormat(construccion)`
4. Line ~956: `formatCurrency(total, proyecto.moneda_base ?? "COP")` → `siteFormat(total)`
5. Line ~957: `formatCurrency(construccion, proyecto.moneda_base ?? "COP")` → `siteFormat(construccion)`
6. Line ~973: `formatCurrency(totalPrecio, proyecto.moneda_base ?? "COP")` → `siteFormat(totalPrecio)`
7. Line ~981: `formatCurrency(terreno, proyecto.moneda_base ?? "COP")` → `siteFormat(terreno)`
8. Line ~1191: `formatCurrency(precioDesde, proyecto.moneda_base ?? "COP")` → `siteFormat(precioDesde)`
9. Line ~1306: `formatCurrency(min, proyecto.moneda_base ?? "COP")` → `siteFormat(min)`
10. Line ~1318: `formatCurrency(displayPrice, proyecto.moneda_base ?? "COP")` → `siteFormat(displayPrice)`

Use find-and-replace: search for `formatCurrency(` and replace each call. The second argument (`proyecto.moneda_base ?? "COP"`) is always the same, so the pattern is consistent.

- [ ] **Step 3: Add approximation notice**

Find the first price display area in the page — the specs/price section inside the typology detail panel. After the existing price display section (near the "Desde" label ~line 1187), add a subtle notice when currency is converted:

```tsx
{isConverted && (
  <p className="text-[9px] font-mono text-[var(--text-muted)] mt-1">
    ≈ {displayCurrency}
  </p>
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors. Ensure `formatCurrency` is no longer imported (no unused import warnings).

- [ ] **Step 5: Commit**

```bash
git add src/app/sites/[slug]/tipologias/page.tsx
git commit -m "feat: wire currency conversion into tipologías page"
```

---

### Task 4: Wire Currency Conversion into Inventario Page

**Files:**
- Modify: `src/app/sites/[slug]/inventario/page.tsx`

- [ ] **Step 1: Replace import and add hook call**

In `src/app/sites/[slug]/inventario/page.tsx`:

Replace the import:
```tsx
import { formatCurrency } from "@/lib/currency";
```
With:
```tsx
import { useSiteFormatCurrency } from "@/hooks/useSiteFormatCurrency";
```

Inside the default export component, after the existing hook calls, add:

```tsx
const { siteFormat, isConverted, displayCurrency } = useSiteFormatCurrency();
```

- [ ] **Step 2: Replace all `formatCurrency` calls**

Replace every instance of `formatCurrency(..., proyecto.moneda_base ?? "COP")` with `siteFormat(...)`. There are 8 calls:

1. Line ~905: `formatCurrency(t.precio_desde!, proyecto.moneda_base ?? "COP")` → `siteFormat(t.precio_desde!)`
2. Line ~921: `formatCurrency(price, proyecto.moneda_base ?? "COP")` → `siteFormat(price)`
3. Line ~928: `formatCurrency(specRanges.precio.min, proyecto.moneda_base ?? "COP")` → `siteFormat(specRanges.precio.min)`
4. Line ~1135: `formatCurrency(t.precio_desde!, proyecto.moneda_base ?? "COP")` → `siteFormat(t.precio_desde!)`
5. Line ~1146: `formatCurrency(price, proyecto.moneda_base ?? "COP")` → `siteFormat(price)`
6. Line ~1149: `formatCurrency(listSpecRanges.precio.min, proyecto.moneda_base ?? "COP")` → `siteFormat(listSpecRanges.precio.min)`
7. Line ~1167: `formatCurrency(price, proyecto.moneda_base ?? "COP")` → `siteFormat(price)` (inside the list view price render)
8. Line ~1323: `formatCurrency(tipo.precio_desde, proyecto.moneda_base ?? "COP")` → `siteFormat(tipo.precio_desde)`

- [ ] **Step 3: Add approximation notice**

Add a subtle currency indicator near the header of the inventory section. Find the table/grid header area and add:

```tsx
{isConverted && (
  <span className="text-[9px] font-mono text-[var(--text-muted)]">
    ≈ {displayCurrency}
  </span>
)}
```

Place it near the price column header or the sort controls.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/sites/[slug]/inventario/page.tsx
git commit -m "feat: wire currency conversion into inventario page"
```

---

### Task 5: Wire Currency Conversion into Cotizador Components

**Files:**
- Modify: `src/components/site/CotizadorFlowMultiStep.tsx`
- Modify: `src/components/site/CotizadorModal.tsx`

- [ ] **Step 1: Update CotizadorFlowMultiStep**

In `src/components/site/CotizadorFlowMultiStep.tsx`:

Add the import:
```tsx
import { useSiteFormatCurrency } from "@/hooks/useSiteFormatCurrency";
```

Inside the component, after existing hooks, add:
```tsx
const { siteFormat } = useSiteFormatCurrency();
```

Replace all 8 `formatCurrency(..., moneda)` calls with `siteFormat(...)`:

1. Line ~358: `formatCurrency(unidad.precio, moneda)` → `siteFormat(unidad.precio)`
2. Line ~518: `formatCurrency(unidad.precio, moneda)` → `siteFormat(unidad.precio)`
3. Line ~534: `formatCurrency(terrenoPrice, moneda)` → `siteFormat(terrenoPrice)`
4. Line ~542: `formatCurrency(construccionPrice, moneda)` → `siteFormat(construccionPrice)`
5. Line ~549: `formatCurrency(terrenoPrice + construccionPrice, moneda)` → `siteFormat(terrenoPrice + construccionPrice)`
6. Line ~576: `formatCurrency(fase.monto_por_cuota, moneda)` → `siteFormat(fase.monto_por_cuota)`
7. Line ~584: `formatCurrency(fase.monto_total, moneda)` → `siteFormat(fase.monto_total)`
8. Line ~594: `formatCurrency(resultado.precio_neto, moneda)` → `siteFormat(resultado.precio_neto)`

**Important:** Keep `import { formatCurrency } from "@/lib/currency"` IF it's still used elsewhere in the file (check the lead-only flow at line ~358 which formats price for the lead message body — that one should stay in base currency since it's data sent to the DB, not displayed to the visitor). The lead message string at line ~358 is internal data — keep it as `formatCurrency(unidad.precio, moneda)`. Only convert the JSX display calls (lines 518+).

Also remove the `moneda` variable (line ~311) if it becomes unused after the changes. If it's still used in the lead message body (line ~358), keep it.

- [ ] **Step 2: Update CotizadorModal**

In `src/components/site/CotizadorModal.tsx`:

Add the import:
```tsx
import { useSiteFormatCurrency } from "@/hooks/useSiteFormatCurrency";
```

Inside the component, after existing hooks, add:
```tsx
const { siteFormat } = useSiteFormatCurrency();
```

Replace the 1 call at line ~609:
```tsx
formatCurrency(tipo.precio_desde, moneda)
```
→
```tsx
siteFormat(tipo.precio_desde)
```

Keep `moneda` variable and `formatCurrency` import since `moneda` is still used by `CotizadorFlowMultiStep` via props and the `formatCurrency` import may still be referenced elsewhere in the file.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors. Check for unused imports of `formatCurrency` or `moneda` and clean up if needed.

- [ ] **Step 4: Commit**

```bash
git add src/components/site/CotizadorFlowMultiStep.tsx src/components/site/CotizadorModal.tsx
git commit -m "feat: wire currency conversion into cotizador components"
```

---

### Task 6: End-to-End Verification

**Files:** None (testing only)

- [ ] **Step 1: Build check**

Run: `npm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 2: Browser verification**

Run: `npm run dev`

Navigate to a microsite and test the full flow:

1. **Settings panel**: Click gear icon → panel opens and stays open
2. **Currency dropdown**: Click currency dropdown inside settings → portal opens → settings panel stays open
3. **Select currency**: Change from COP to USD → dropdown closes → settings panel stays open
4. **Prices update**: Navigate to tipologías page — all prices should now show in USD
5. **Inventario**: Navigate to inventario page — all prices in USD
6. **Cotizador**: Open cotizador modal for a unit — all prices (breakdown, payment plan, total) in USD
7. **Approximation badge**: When in a non-base currency, a subtle "≈ USD" indicator should appear
8. **Persistence**: Refresh the page — currency preference should persist (localStorage)
9. **Switch back**: Change currency back to COP — all prices return to original values

- [ ] **Step 3: Commit and push**

```bash
git push origin dev
```

Wait for Vercel build to succeed. Check deployment at the Vercel dashboard.
