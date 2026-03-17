# Mejoras de Diseño para Tipologías - Etapas y Tabs

## Problema
El diseño actual de los selectores de etapas/torres y los tabs de tipologías se ve "crammed" (apretado) y poco pulido.

## Solución
Aplicar mejoras de spacing, tipografía y micro-animaciones para crear más jerarquía visual y breathing room.

---

## Cambios Requeridos

### 1. Torre/Etapa Selector (líneas 393-412)

**Antes:**
```tsx
{isMultiTorre && (
  <div className="flex-shrink-0 flex items-center gap-2 px-6 lg:px-12 pt-4 pb-1">
    {torres.map((torre) => (
      <button
        key={torre.id}
        onClick={() => setActiveTorreId(torre.id)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wider uppercase transition-all cursor-pointer",
          activeTorreId === torre.id
            ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] ring-1 ring-[rgba(var(--site-primary-rgb),0.3)]"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass-bg)]"
        )}
      >
        <Building2 size={13} />
        {torre.nombre}
      </button>
    ))}
  </div>
)}
```

**Después:**
```tsx
{isMultiTorre && (
  <div className="flex-shrink-0 flex items-center gap-2.5 px-6 lg:px-12 pt-6 pb-5">
    {torres.map((torre) => (
      <button
        key={torre.id}
        onClick={() => setActiveTorreId(torre.id)}
        className={cn(
          "font-site-label flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[11px] font-semibold tracking-[0.15em] uppercase transition-all cursor-pointer",
          activeTorreId === torre.id
            ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] ring-1 ring-[rgba(var(--site-primary-rgb),0.4)] shadow-[0_0_12px_rgba(var(--site-primary-rgb),0.15)]"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.07] hover:ring-1 hover:ring-white/10"
        )}
      >
        <Building2 size={14} strokeWidth={2.5} />
        {torre.nombre}
      </button>
    ))}
  </div>
)}
```

**Cambios clave:**
- ✨ `pt-4 pb-1` → `pt-6 pb-5` — Más breathing room vertical
- ✨ `gap-2` → `gap-2.5` — Más espacio entre chips
- ✨ `px-4 py-2` → `px-5 py-2.5` — Chips más grandes y cómodos
- ✨ `text-xs` → `text-[11px]` con `tracking-[0.15em]` — Mejor legibilidad
- ✨ Agregado `font-site-label` — Usa Syne (la fuente correcta para labels)
- ✨ `font-medium` → `font-semibold` — Más peso visual
- ✨ `Building2 size={13}` → `size={14} strokeWidth={2.5}` — Iconos más defined
- ✨ Agregado glow shadow al estado activo — `shadow-[0_0_12px_rgba(var(--site-primary-rgb),0.15)]`
- ✨ Agregado hover ring — `hover:ring-1 hover:ring-white/10`

---

### 2. Tipología Tab Bar (líneas 414-453)

**Antes:**
```tsx
<div className={cn("flex-shrink-0 px-6 lg:px-12 pb-3", isMultiTorre ? "pt-2" : "pt-5")}>
  <div className="flex items-end gap-6">
    {visibleTipologias.map((tipo, idx) => {
      const isActive = idx === activeIndex;
      const tipoUnits = isMultiTipo
        ? unidades.filter(u => unidadTipologias.some(ut => ut.unidad_id === u.id && ut.tipologia_id === tipo.id))
        : unidades.filter((u) => u.tipologia_id === tipo.id);
      const disponibles = tipoUnits.filter((u) => u.estado === "disponible").length;
      return (
        <button
          key={tipo.id}
          onClick={() => { setActiveIndex(idx); setEstadoFilter("todas"); setSelectedUnit(null); setActiveHotspot(null); }}
          className={cn(
            "relative pb-3 cursor-pointer transition-colors duration-200 group",
            isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          <span className="text-sm font-medium tracking-wide">{tipo.nombre}</span>
          {disponibles > 0 && (
            <span className={cn(
              "ml-2 text-[10px] tabular-nums transition-colors duration-200",
              isActive ? "text-[var(--site-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-tertiary)]"
            )}>
              {disponibles}
            </span>
          )}
          {isActive && (
            <motion.div
              layoutId="tipo-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--site-primary)] rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
        </button>
      );
    })}
  </div>
  <div className="h-px bg-[var(--border-subtle)]" />
</div>
```

**Después:**
```tsx
<div className={cn("flex-shrink-0 px-6 lg:px-12 pb-5", isMultiTorre ? "pt-3" : "pt-6")}>
  <div className="flex items-end gap-8 mb-4">
    {visibleTipologias.map((tipo, idx) => {
      const isActive = idx === activeIndex;
      const tipoUnits = isMultiTipo
        ? unidades.filter(u => unidadTipologias.some(ut => ut.unidad_id === u.id && ut.tipologia_id === tipo.id))
        : unidades.filter((u) => u.tipologia_id === tipo.id);
      const disponibles = tipoUnits.filter((u) => u.estado === "disponible").length;
      return (
        <button
          key={tipo.id}
          onClick={() => { setActiveIndex(idx); setEstadoFilter("todas"); setSelectedUnit(null); setActiveHotspot(null); }}
          className={cn(
            "relative pb-4 cursor-pointer transition-all duration-200 group",
            isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          <div className="flex items-baseline gap-2.5">
            <span className="text-base font-medium tracking-wide">{tipo.nombre}</span>
            {disponibles > 0 && (
              <span className={cn(
                "text-[11px] font-mono tabular-nums transition-all duration-200",
                isActive ? "text-[var(--site-primary)] font-medium" : "text-[var(--text-muted)] group-hover:text-[var(--text-tertiary)]"
              )}>
                {disponibles}
              </span>
            )}
          </div>
          {isActive && (
            <motion.div
              layoutId="tipo-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[var(--site-primary)] to-[rgba(var(--site-primary-rgb),0.6)] rounded-full shadow-[0_0_8px_rgba(var(--site-primary-rgb),0.4)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
        </button>
      );
    })}
  </div>
  <div className="h-px bg-[var(--border-default)]" />
</div>
```

**Cambios clave:**
- ✨ `pb-3` → `pb-5` — Más espacio después de los tabs
- ✨ `pt-2` → `pt-3` / `pt-5` → `pt-6` — Mejor spacing superior
- ✨ `gap-6` → `gap-8` — Más espacio horizontal entre tabs
- ✨ Agregado `mb-4` al contenedor de tabs — Separa tabs del divider
- ✨ `pb-3` → `pb-4` — Más espacio para el indicador animado
- ✨ `transition-colors` → `transition-all` — Transiciones más suaves
- ✨ `text-sm` → `text-base` — Nombres de tipología más prominentes
- ✨ Contador envuelto en `<div className="flex items-baseline gap-2.5">` — Mejor alineación
- ✨ `ml-2 text-[10px]` → `text-[11px] font-mono` — Contador más legible
- ✨ Agregado `font-medium` al contador activo — Más peso
- ✨ `h-[2px]` → `h-[2.5px]` — Indicador más visible
- ✨ Indicador con gradiente — `bg-gradient-to-r from-[var(--site-primary)] to-[rgba(var(--site-primary-rgb),0.6)]`
- ✨ Agregado glow al indicador — `shadow-[0_0_8px_rgba(var(--site-primary-rgb),0.4)]`
- ✨ `bg-[var(--border-subtle)]` → `bg-[var(--border-default)]` — Divider más visible

---

## Resumen de Mejoras

### Spacing
- Más padding vertical: `pt-6` en lugar de `pt-4`, `pb-5` en lugar de `pb-1`
- Más gap entre elementos: `gap-8` en lugar de `gap-6`
- Mejor separación entre secciones: `mb-4` agregado

### Tipografía
- Fuente correcta para labels: `font-site-label` (Syne)
- Mejor tracking: `tracking-[0.15em]` para uppercase
- Tamaños más legibles: `text-base` para tipologías, `text-[11px]` para contadores
- Más peso visual: `font-semibold` para torres

### Visual Hierarchy
- Gradientes en indicadores activos
- Glow shadows para estados activos
- Rings en hover states
- Iconos más definidos con `strokeWidth={2.5}`
- Border divisor más visible con `--border-default`

### Micro-animaciones
- `transition-all` en lugar de `transition-colors`
- Glow effects en estados activos
- Hover rings con transiciones suaves

---

## Instrucciones de Aplicación

1. **Detén el dev server** si está corriendo:
   ```bash
   # Presiona Ctrl+C en la terminal donde corre npm run dev
   ```

2. **Aplica los cambios** editando [src/app/sites/[slug]/tipologias/page.tsx](src/app/sites/[slug]/tipologias/page.tsx)

3. **Restaura backup si algo sale mal**:
   ```bash
   cp src/app/sites/[slug]/tipologias/page.tsx.backup src/app/sites/[slug]/tipologias/page.tsx
   ```

4. **Reinicia el dev server**:
   ```bash
   npm run dev
   ```

---

## Preview Visual

### Antes
- Etapas: pequeñas, apretadas, poco contraste
- Tabs: texto pequeño, poco espacio, indicador delgado
- Overall: se ve crammed, sin breathing room

### Después
- Etapas: más grandes, mejor spacing, glow en activo, hover ring
- Tabs: texto más grande, más espacio, indicador con gradiente y glow
- Overall: polished, con jerarquía clara, breathing room apropiado
