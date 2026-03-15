# Dashboard Architecture

This document explains the NODDO dashboard architecture implemented in March 2026.

## Overview

The dashboard is split into two main pages with distinct purposes:

1. **`/dashboard`** — Home page with overview, analytics, and quick access
2. **`/proyectos`** — Dedicated project management interface with full CRUD capabilities

## Page Comparison

| Feature | `/dashboard` (Home) | `/proyectos` (Table) |
|---------|---------------------|----------------------|
| **Purpose** | Overview & quick access | Full project management |
| **Layout** | Vertical sections | Table with filters |
| **Projects shown** | 3 most recent | All projects |
| **KPI strip** | ✅ Yes | ❌ No |
| **Shortcuts** | ✅ Enhanced design | ❌ No |
| **Search** | ❌ No | ✅ Yes (debounced) |
| **Filters** | ❌ No | ✅ Status chips |
| **Sort** | ❌ No | ✅ 6 options |
| **CRUD modals** | Navigate to `/proyectos` | ✅ Full inline |
| **Analytics** | ✅ Page view, shortcuts | ✅ All interactions |

## Navigation Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Login Page                          │
│                    /login                               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓ (authenticated)
┌─────────────────────────────────────────────────────────┐
│                  Dashboard Home                         │
│                   /dashboard                            │
│                                                         │
│  1. Greeting (admin/colaborador)                        │
│  2. KPI Strip (metrics, project filter)                 │
│  3. Enhanced Shortcuts (4 large cards)                  │
│  4. Recent Projects (3 cards)                           │
│     └─> "Ver todos" button                              │
└──────────┬──────────────────────────────────────────────┘
           │
           ↓ (click "Ver todos" or sidebar "Proyectos")
┌─────────────────────────────────────────────────────────┐
│                  Projects Table                         │
│                  /proyectos                             │
│                                                         │
│  1. Page header                                         │
│  2. Filters (search, status, sort, create)              │
│  3. Table (all projects, sortable, selectable)          │
│  4. Create/Delete modals                                │
└──────────┬──────────────────────────────────────────────┘
           │
           ↓ (click "Editar")
┌─────────────────────────────────────────────────────────┐
│                  Project Editor                         │
│               /editor/[id]                              │
│                                                         │
│  Tabs: General, Tipologías, Galería, etc.              │
│  Back button → /proyectos                               │
└─────────────────────────────────────────────────────────┘
```

## Component Hierarchy

### Dashboard Home (`/dashboard`)

```tsx
<DashboardPage>
  <DashboardGreeting
    user={user}
    isAdmin={isAdmin}
    onCreateProject={...}
  />

  {isAdmin && projects.length > 0 && (
    <DashboardKPIStrip
      data={summary}
      projects={projects}
      selectedProjectId={kpiProjectFilter}
      onSelectProject={setKpiProjectFilter}
    />
  )}

  {isAdmin && projects.length > 0 && (
    <DashboardShortcutsEnhanced
      leadCount={summary?.total_leads}
    />
  )}

  <RecentProjectsPreview
    projects={projects.slice(0, 3)}
    totalCount={projects.length}
    isAdmin={isAdmin}
    onDelete={handleDelete}
    onClone={handleClone}
  />
</DashboardPage>
```

### Projects Table (`/proyectos`)

```tsx
<ProyectosPage>
  {/* Page Header */}
  <h1>Proyectos</h1>
  <p>Gestiona todos tus proyectos inmobiliarios</p>

  {projects.length === 0 ? (
    {/* Empty State */}
    <EmptyState />
  ) : (
    <>
      <ProjectsFilters
        search={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onCreateClick={() => setShowCreate(true)}
        isAdmin={isAdmin}
        total={filteredProjects.length}
      />

      <ProjectsTable
        projects={filteredProjects}
        loading={loading}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onEdit={(id) => router.push(`/editor/${id}`)}
        onDelete={handleDelete}
        onClone={handleClone}
        isAdmin={isAdmin}
      />
    </>
  )}

  {/* Modals */}
  <CreateProjectModal />
  <DeleteConfirmModal />
</ProyectosPage>
```

## Design System Integration

### Enhanced Shortcuts

**Visual Hierarchy:**
- **Large icons:** 64x64px containers (vs 16px before)
- **Gold backgrounds:** `rgba(var(--site-primary-rgb), 0.15)`
- **Hover effects:** Scale 110% + rotate 3deg
- **Descriptions:** Context for each shortcut
- **2-column grid:** More space per card (vs 4-column)

**Typography:**
- Heading: Syne 700, uppercase, tracking-wider
- Description: DM Mono 300, xs, text-tertiary
- Badge: DM Mono 700, xs, gold background

### Table Design

**Pattern:** Based on `LeadsCRMTable` component

**Columns:**
1. **Imagen** - 60×40px thumbnail
2. **Nombre** - Project name + slug.noddo.io
3. **Estado** - Badge with pulse animation
4. **Unidades** - Count (hidden on mobile)
5. **Leads 7d** - 7-day count (hidden on tablet)
6. **Visitas 7d** - 7-day count (hidden on desktop)
7. **Creado** - Relative date (hidden on mobile)
8. **Acciones** - Edit/Clone/Delete dropdown

**Interactions:**
- Row selection: Gold left border + surface-2 background
- Hover: surface-2/50 background
- Enter key: Open editor
- Framer Motion: Stagger 0.03s per row

## State Management

### React Query Hooks

```typescript
// Projects data
const { data: projects, isLoading, refetch } = useProjects();

// Create mutation
const { mutate: createProject, isPending } = useCreateProject();

// Delete mutation
const { mutate: deleteProject, isPending } = useDeleteProject();
```

### Local State

```typescript
// Dashboard Home
const [kpiProjectFilter, setKpiProjectFilter] = useState<string | null>(null);

// Projects Table
const [searchQuery, setSearchQuery] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("todos");
const [sortBy, setSortBy] = useState("reciente");
const [selectedId, setSelectedId] = useState<string | null>(null);
```

## Analytics Integration

Every user interaction is tracked for insights:

**Page Views:**
```typescript
useEffect(() => {
  trackDashboardEvent("dashboard_view", {
    projects_count: projects.length,
  }, user?.id, role || undefined);
}, [loading]);
```

**Actions:**
```typescript
const handleCreate = async () => {
  createProject({ nombre, slug }, {
    onSuccess: (proyecto) => {
      trackDashboardEvent("project_create", {
        project_id: proyecto.id,
        project_name: nombre,
      }, user?.id, role || undefined);
    }
  });
};
```

**Shortcuts:**
```typescript
<Link
  href="/leads"
  onClick={() => trackDashboardEvent("shortcut_leads_click", {
    destination: "/leads",
  }, user?.id, role || undefined)}
>
```

See [ANALYTICS.md](./ANALYTICS.md) for full tracking documentation.

## Responsive Behavior

### Breakpoints

- **Mobile** (`< 768px`): Single column, hide table columns
- **Tablet** (`768px - 1024px`): 2-column shortcuts, some table columns
- **Desktop** (`> 1024px`): Full layout, all columns visible

### Mobile Drawer

- Sidebar becomes slide-in drawer on mobile
- Hamburger menu in top-left (z-index 50)
- Overlay backdrop (z-index 39)
- Smooth transitions (300ms cubic-bezier)

## Performance Optimizations

### Debouncing

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 400);
  return () => clearTimeout(timer);
}, [searchQuery]);
```

### Memoization

```typescript
const filteredProjects = useMemo(() => {
  return projects
    .filter(filterFn)
    .sort(sortFn);
}, [projects, debouncedSearch, statusFilter, sortBy]);
```

### React Query Caching

- Projects cached with `staleTime: 5 * 60 * 1000` (5 minutes)
- Optimistic updates on create/delete
- Automatic refetch on window focus

## Migration Guide

### For Existing Users

No action required - all existing routes work:
- Previous bookmarks to `/proyectos` remain valid
- Sidebar navigation updated automatically
- Login redirects to new `/dashboard` home

### For Developers

**Update any hardcoded redirects:**
```typescript
// Before
router.push("/proyectos");

// After (for home navigation)
router.push("/dashboard");

// Keep for project management
router.push("/proyectos");
```

**Update middleware protection:**
```typescript
const isDashboardRoute =
  pathname === "/dashboard" ||  // NEW
  pathname === "/proyectos" ||
  // ... other routes
```

## Future Enhancements

- [ ] Bulk actions (select multiple rows)
- [ ] Export projects to CSV
- [ ] Column visibility toggle
- [ ] Saved filter presets
- [ ] Project templates
- [ ] Drag-and-drop reordering
- [ ] Real-time collaboration indicators
- [ ] Recent activity feed
