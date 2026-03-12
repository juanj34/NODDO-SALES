# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NodeSites** is a SaaS platform for real estate developers (constructoras) to create premium digital showroom microsites. Two distinct parts:

1. **Microsite (public)** at `/sites/[slug]/*` — Immersive, warm-toned, landscape-first buyer experience
2. **Dashboard (admin)** at `/(dashboard)/*` — Project management panel (proyectos, editor, leads)

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build (Turbopack)
npm run lint     # ESLint
npm run start    # Start production server
```

## Tech Stack

- **Next.js 16** with App Router, TypeScript strict (no `any`)
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Framer Motion** for animations and page transitions
- **Supabase** for DB, auth, storage (`@supabase/ssr`)
- **Mapbox GL JS** for interactive satellite maps with POIs
- **Lucide React** for icons

## Design System

### Philosophy
Dark luxury with depth. Layered surfaces, warm champagne accents, sophisticated glassmorphism, and purposeful micro-interactions. Premium and immersive — like Linear.app meets luxury real estate.

### Color Palette (CSS custom properties in globals.css)
- `--site-primary: #D4A574` — Warm champagne accent (customizable per project)
- `--site-primary-rgb: 212, 165, 116` — For rgba() usage
- `--site-bg: #0A0A0B` — Near-black base

### Surface System (elevation layers)
- `--surface-0: #0A0A0B` — Base background
- `--surface-1: #111113` — Sidebar, cards base
- `--surface-2: #1A1A1D` — Cards hover, modals
- `--surface-3: #222226` — Inputs, active elements
- `--surface-4: #2A2A2F` — Elevated elements

### Border & Text Hierarchy
- `--border-subtle` (white 6%), `--border-default` (white 10%), `--border-strong` (white 16%)
- `--text-primary` (white 92%), `--text-secondary` (white 55%), `--text-tertiary` (white 35%), `--text-muted` (white 18%)

### Glassmorphism (globals.css utilities)
- `.glass` — Dark frosted (white/4% bg, blur-24, inset highlight)
- `.glass-light` — Lighter frosted (white/7% bg, blur-32)
- `.glass-dark` — Black frosted (black/70% bg, blur-32, shadow)
- `.glass-card` — Rounded card (white/3% bg, blur-24, rounded-[1.25rem], shadow)

### Buttons (globals.css)
- `.btn-warm` — Gold gradient, dark text, rounded-[0.75rem], glow shadow, hover lift
- `.btn-outline-warm` — Gold border, transparent bg, hover fills with glow
- `.btn-ghost` — Transparent, subtle border on hover

### Input Styles
- `.input-glass` — surface-3 bg, border-default, focus with primary glow ring

### Design Rules
- Use surface layers for depth (surface-0 → surface-4, never flat bg-white/5)
- Use CSS variables for ALL accent colors — never hardcode hex
- For primary color with opacity: `rgba(var(--site-primary-rgb), 0.XX)` — NOT `var(--site-primary)/XX`
- Rounded corners: 0.625rem (inputs/small), 0.75rem (buttons), 1.25rem (cards)
- Framer Motion for all page transitions and interactive elements
- Glow effects: `var(--glow-sm)`, `var(--glow-md)`, `var(--glow-lg)`
- Shadows: `var(--shadow-sm)` through `var(--shadow-xl)` for consistent depth

### Typography — NODDO Brand Fonts

Three fonts. Each has a specific role. Never mix them up.

#### Cormorant Garamond
**Use for:** Hero titles, section headings, large display numbers, italic accents, pull quotes.
**Weight:** 300 (light) for most display use. 400 for body-sized headings. 600 sparingly for emphasis.
**Style:** Italic (`font-style: italic`) is encouraged for contrast moments — taglines, em phrases inside headlines.
**Never use for:** UI labels, buttons, captions, data, navigation, anything under 18px.

#### Syne
**Use for:** Navigation, buttons, CTAs, section labels, badges, tags, uppercase utility text.
**Weight:** 700 or 800 for buttons and labels. 600 for nav links. 400 only in combination with heavier weights for contrast.
**Style:** Always uppercase with `letter-spacing: .08em` to `.2em` depending on size. Smaller = more spacing.
**Never use for:** Body copy, long paragraphs, anything that needs to be read continuously.

#### DM Mono
**Use for:** Body copy, descriptions, specs, data values, prices, card content, form labels, captions, footer text.
**Weight:** 300 (light) for body. 400 for data that needs slightly more presence (prices, availability labels). 500 only for single values you need to pop (like a percentage or a unit count).
**Style:** Never uppercase unless it's a very short label (2–3 chars max). Monospace rhythm works best in lowercase or sentence case.
**Never use for:** Headings, hero text, anything decorative.

#### Quick reference

| Element | Font | Weight | Case |
|---|---|---|---|
| Hero headline | Cormorant Garamond | 300 | Title or sentence |
| Section heading | Cormorant Garamond | 300–400 | Sentence |
| Italic accent / tagline | Cormorant Garamond italic | 300 | Sentence |
| Button / CTA | Syne | 700 | UPPERCASE |
| Nav link | Syne | 600 | UPPERCASE |
| Section label / badge | Syne | 700–800 | UPPERCASE |
| Body paragraph | DM Mono | 300 | Sentence |
| Price / data value | DM Mono | 400–500 | As-is |
| Card label / caption | DM Mono | 300 | UPPERCASE only if ≤3 chars |
| Footer text | DM Mono | 300 | Sentence |

#### Size floor rules
- Cormorant Garamond: minimum 24px. Below that it loses its character.
- Syne: minimum 9px at uppercase. Works well from 9px to 20px for labels.
- DM Mono: minimum 10px. Preferred body size 12–14px. Line height always 1.7–1.9 for readability.

## Architecture

### Route Groups

- **`src/app/sites/[slug]/`** — Public microsite. Server layout fetches project from Supabase (with mock fallback), passes to client via React context. All pages use `"use client"` + Framer Motion.
- **`src/app/(dashboard)/`** — Admin panel with sidebar layout. Route group means pages live at `/proyectos`, `/editor/[id]`, `/leads`, `/login`. Protected by middleware auth.
- **`src/app/api/`** — RESTful API routes for all CRUD: proyectos, tipologias, galeria (categorias + imagenes), videos, leads, upload.
- **`src/app/auth/callback/`** — OAuth callback handler for Supabase Auth.

### Data Flow

- **Microsite pages** use `useSiteProject()` hook (React context) to access the `ProyectoCompleto` object. Context is provided by `SiteLayoutClient` which receives data from the server layout.
- **Dashboard pages** fetch data via `/api/*` routes using `useProjects()` and `useProject(id)` hooks. All API routes use server-side Supabase client with auth checks.
- **Mock fallback**: `src/data/mock.ts` provides demo data with Unsplash images when Supabase is not configured.

### Authentication

- **Middleware** (`src/middleware.ts`) protects `/proyectos`, `/editor/*`, `/leads` — redirects to `/login` if not authenticated.
- **Login** supports email/password + Google OAuth via Supabase Auth.
- **Auth callback** at `/auth/callback` exchanges OAuth code for session.

### Key Component Patterns

- **`SiteLayoutClient`** — Client wrapper providing `SiteProjectContext`, injects CSS custom properties from branding, renders nav/WhatsApp/rotation warning/disclaimer.
- **`useSiteProject()`** (`src/hooks/useSiteProject.ts`) — Hook for microsite pages to access project data from context.
- **`MapboxMap`** (`src/components/site/MapboxMap.tsx`) — Interactive Mapbox GL satellite map with project marker (gold pulse) and POI markers (white dots). Supports flyTo on selection.
- **`POIPanel`** (`src/components/site/POIPanel.tsx`) — Right-side glass-panel overlay showing POI details (image, name, city, distance, time, description) with prev/next navigation.
- **`Lightbox`** — Fullscreen image viewer with keyboard nav (arrows/escape), thumbnail strip, Framer Motion transitions.
- **`LeadForm`** — Contact form POSTing to `/api/leads` with automatic UTM capture, glassmorphism styling.

### Microsite Pages

| Page | Design Pattern |
|------|---------------|
| Landing (`page.tsx`) | Fullscreen hero image with warm gradient overlay, gold CTA pill |
| Tipologías | Fullscreen slider: background renders, arrow nav, thumbnail strip, type selector panel |
| Galería | Tabs for categories + horizontal scroll slider, lightbox on click |
| Ubicación | Fullscreen Mapbox satellite map + POI markers + glass detail panel |
| Videos | YouTube embed + video list sidebar with glass styling |
| Contacto | Blurred background + glass-card contact form |
| Brochure | PDF embed with glass styling |
| Tour 360 | Matterport iframe embed |

### Database Tables

| Table | Description |
|-------|-------------|
| `proyectos` | Real estate projects with branding, location, contact info |
| `tipologias` | Property types (apartments, houses) with specs and renders |
| `galeria_categorias` | Gallery categories with ordered images |
| `galeria_imagenes` | Individual gallery images |
| `videos` | YouTube video references |
| `leads` | Contact form submissions |
| `puntos_interes` | Map POIs with coordinates, distance, travel time |

### Supabase

- Schema: `supabase/migrations/`
- Browser client: `src/lib/supabase/client.ts`
- Server client: `src/lib/supabase/server.ts`
- Server queries: `src/lib/supabase/server-queries.ts`
- Client queries: `src/lib/supabase/queries.ts`

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

## Conventions

- TypeScript only, never JS. Props typed with interfaces.
- Path aliases: `@/components`, `@/lib`, `@/types`, `@/data`, `@/hooks`
- PascalCase for component files, camelCase for utilities
- CSS variables for per-project theming, Tailwind utility-first
- Glassmorphism utilities from globals.css for consistent glass effects
- Microsites are landscape-first; portrait mobile shows rotation overlay
- Never hardcode project content in reusable components — always use context/props
- Unsplash URLs for placeholder images in mock data

## Business Context

- Target: Real estate developers in Latin America (Colombia primarily)
- Language: Spanish (es)
- WhatsApp is the primary contact channel — always show floating button
- Microsites must feel premium: dark luxury with layered surfaces, warm champagne accents, sophisticated glassmorphism, depth through shadows and glows
