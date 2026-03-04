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
Warm and inviting. Soft earth tones, cream/off-white accents, glassmorphism, rounded shapes. Premium but approachable — like a high-end wellness or lifestyle brand.

### Color Palette (CSS custom properties in globals.css)
- `--site-primary` — Accent gold (`#C9A96E`) → `text-site-primary`, `bg-site-primary`
- `--site-secondary` — Text color (`#ffffff`)
- `--site-bg` — Background (`#0a0a0a`)
- `--cream` — Light warm (`#F5F0E8`)
- `--warm-50` to `--warm-900` — Warm gray scale (registered as `text-warm-*`, `bg-warm-*`)

### Glassmorphism Utilities (globals.css)
- `.glass` — Dark frosted glass (white/6% bg, blur-20, white/10% border)
- `.glass-light` — Lighter frosted glass (white/10% bg, blur-24)
- `.glass-card` — Dark rounded card (white/5% bg, blur-16, rounded-3xl, shadow)
- `.glass-panel` — Light/white panel for overlays (white/94% bg, blur-20)

### Button Styles (globals.css)
- `.btn-warm` — Gold gradient, rounded-full, shadow, hover lift effect
- `.btn-outline-warm` — Gold border, rounded-full, hover fills gold

### Design Rules
- Use glassmorphism for overlays, navigation, cards
- Rounded shapes everywhere: `rounded-2xl`, `rounded-3xl`, `rounded-full`
- Warm gradient overlays on hero images: `from-[#1A1610]/80`
- Gold accent (`--site-primary`) for CTAs, active states, highlights
- Unsplash real estate photos for mock data (not picsum.photos)
- Framer Motion for all page transitions and interactive elements
- Dark backgrounds with warm undertones, never pure black alone

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
- Microsites must feel premium: dark backgrounds with warm undertones, gold accents, glassmorphism, rounded shapes, high-quality imagery
