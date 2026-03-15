# Changelog

All notable changes to the NODDO platform will be documented in this file.

## [2.0.0] - 2026-03-15

### 🎨 Dashboard Restructure (Major Update)

#### Added

**New Dashboard Home (`/dashboard`)**
- Created new dashboard landing page at `/dashboard` with analytics overview
- Enhanced shortcuts component with large icons (64px), descriptions, and hover animations
- Recent projects preview showing last 3 projects with "Ver todos" CTA
- KPI strip integration for at-a-glance metrics
- Greeting component with role-based messaging

**Projects Table View (`/proyectos`)**
- Complete table redesign based on LeadsCRMTable pattern
- Searchable interface with 400ms debounce
- Status filter chips (Todos, Publicado, Borrador, Archivado)
- 6 sort options: Más reciente, Más antiguo, A-Z, Z-A, Más leads, Más visitas
- Row selection with keyboard navigation
- Responsive columns (hide on mobile breakpoints)
- Loading skeleton with 8 animated rows
- Empty state with role-based messaging and create CTA

**Analytics Tracking System**
- `dashboard_analytics` table for tracking admin/collaborator actions
- `trackDashboardEvent()` utility for event tracking
- API endpoint at `/api/track/dashboard`
- 20+ tracked events: navigation, CRUD, search, filters, shortcuts
- Session and visitor ID tracking
- Device type and screen width capture
- Metadata support for contextual data
- Development mode with console logging

**New Components**
1. `DashboardShortcutsEnhanced` - 2-column grid with large icons
2. `RecentProjectsPreview` - Shows 3 most recent projects
3. `ProjectsTable` - Main table wrapper with animations
4. `ProjectsFilters` - Search + status + sort controls
5. `ProjectTableRow` - Individual table row with actions
6. `ProjectStatusBadge` - Status badge with pulse animation

#### Changed

**Navigation & Routing**
- Default login redirect: `/proyectos` → `/dashboard`
- Sidebar logo link: `/proyectos` → `/dashboard`
- OAuth callback redirect: `/proyectos` → `/dashboard`
- Platform admin redirect: `/proyectos` → `/dashboard`
- Middleware protection added for `/dashboard` and `/analytics`

**Sidebar Simplification**
- Removed collapsible project dropdown (90+ lines)
- Replaced with simple "Proyectos" link
- Removed `projectsExpanded` state
- Removed `sidebarProjects` fetch
- Removed AnimatePresence collapse logic
- Cleaner, more maintainable navigation

**Projects Page (`/proyectos`)**
- Converted from card grid to table view
- Removed DashboardGreeting (now on `/dashboard`)
- Removed DashboardKPIStrip (now on `/dashboard`)
- Removed DashboardShortcuts (replaced with Enhanced version on `/dashboard`)
- Added React Query hooks: `useProjects`, `useCreateProject`, `useDeleteProject`
- Improved filtering with `useMemo` for better performance
- Enhanced sort options (6 vs 2)

**Documentation**
- Updated `CLAUDE.md` with new dashboard architecture
- Added "Dashboard Architecture" section with navigation flow
- Documented React Query data flow
- Added analytics tracking information
- Created comprehensive `docs/ANALYTICS.md`

#### Technical Improvements

**Performance**
- Debounced search (400ms) to reduce unnecessary re-renders
- `useMemo` for filtered/sorted projects
- React Query for optimistic updates and caching
- Framer Motion stagger animations (0.03s per row)

**Type Safety**
- Proper TypeScript types for all new components
- Type-safe event tracking with `DashboardEventType`
- Role-based permission types

**Accessibility**
- ARIA labels on table headers
- Role attributes on table elements
- Keyboard navigation support (Enter key)
- Screen reader friendly status badges

**Code Quality**
- Consistent gold accent usage: `rgba(var(--site-primary-rgb), X)`
- Design system compliance (Cormorant Garamond, Syne, DM Mono)
- Reusable component patterns
- Clean separation of concerns

#### Migration

**Database Changes**
- Added `dashboard_analytics` table
- Indexes on `user_id`, `event_type`, `created_at`, `session_id`
- RLS policies for authenticated users and platform admins

**Breaking Changes**
- None - all existing routes continue to work
- `/proyectos` still accessible but now shows table view instead of cards
- Previous bookmark links remain valid

#### Files Added (10 new files)

**Components (7 files)**
1. `src/app/(dashboard)/dashboard/page.tsx` - Dashboard home
2. `src/components/dashboard/home/DashboardShortcutsEnhanced.tsx` - Enhanced shortcuts
3. `src/components/dashboard/home/RecentProjectsPreview.tsx` - Projects preview
4. `src/components/dashboard/projects/ProjectsTable.tsx` - Table component
5. `src/components/dashboard/projects/ProjectsFilters.tsx` - Filters component
6. `src/components/dashboard/projects/ProjectTableRow.tsx` - Table row
7. `src/components/dashboard/projects/ProjectStatusBadge.tsx` - Status badge

**Analytics (2 files)**
8. `src/lib/dashboard-tracking.ts` - Tracking utilities
9. `src/app/api/track/dashboard/route.ts` - Analytics API endpoint

**Documentation (1 file)**
10. `docs/ANALYTICS.md` - Analytics implementation guide

#### Files Modified (5 files)

1. `src/app/(dashboard)/layout.tsx` - Removed dropdown, updated logo link
2. `src/app/(dashboard)/proyectos/page.tsx` - Converted to table view
3. `src/middleware.ts` - Added `/dashboard` protection, updated redirects
4. `src/app/auth/callback/route.ts` - Changed default redirect
5. `src/app/(marketing)/login/page.tsx` - Updated default redirect

**Migrations**
6. `supabase/migrations/20260315000000_add_dashboard_analytics.sql`

---

## Previous Versions

Previous changes were not formally documented. This changelog starts with version 2.0.0 (Dashboard Restructure).
