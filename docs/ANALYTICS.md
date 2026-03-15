# Dashboard Analytics Tracking

## Overview

The NODDO dashboard includes comprehensive analytics tracking to understand user behavior, monitor feature usage, and optimize the admin experience.

## Architecture

### Tracking Library

**Location:** `src/lib/dashboard-tracking.ts`

Provides utilities for tracking dashboard events:
- `trackDashboardEvent()` - Send analytics events to the backend
- `useDashboardTracking()` - React hook for easier component integration

### API Endpoint

**Location:** `src/app/api/track/dashboard/route.ts`

Receives analytics events via `POST /api/track/dashboard` and stores them in the `dashboard_analytics` table.

### Database Schema

**Table:** `dashboard_analytics`

```sql
CREATE TABLE dashboard_analytics (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT CHECK (user_role IN ('admin', 'colaborador')),
  page_path TEXT,
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  screen_width INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Tracked Events

### Navigation Events
- `dashboard_view` - User visits dashboard home page
- `projects_view` - User visits projects table page
- `project_detail_view` - User views project editor

### Project Actions
- `project_create` - User creates new project
- `project_edit` - User edits project
- `project_delete` - User confirms project deletion
- `project_clone` - User clones project
- `project_publish` - User publishes project
- `project_archive` - User archives project

### Search & Filters
- `projects_search` - User searches projects (includes query in metadata)
- `projects_filter_status` - User filters by status
- `projects_sort` - User changes sort order

### Shortcuts
- `shortcut_leads_click` - User clicks Leads shortcut
- `shortcut_analytics_click` - User clicks Analytics shortcut
- `shortcut_disponibilidad_click` - User clicks Disponibilidad shortcut
- `shortcut_cotizador_click` - User clicks Cotizador shortcut

### Table Interactions
- `project_table_row_select` - User selects table row
- `project_table_edit_click` - User clicks edit button
- `project_table_delete_click` - User clicks delete button
- `project_table_clone_click` - User clicks clone button

## Implementation Examples

### Track page view

```tsx
import { useEffect } from "react";
import { trackDashboardEvent } from "@/lib/dashboard-tracking";
import { useAuthRole } from "@/hooks/useAuthContext";

export default function MyPage() {
  const { user, role } = useAuthRole();

  useEffect(() => {
    trackDashboardEvent("dashboard_view", {
      projects_count: 5,
    }, user?.id, role || undefined);
  }, [user?.id, role]);

  return <div>...</div>;
}
```

### Track user action

```tsx
const handleCreateProject = async () => {
  const result = await createProject({ nombre, slug });

  trackDashboardEvent("project_create", {
    project_id: result.id,
    project_name: nombre,
  }, user?.id, role || undefined);
};
```

### Track shortcut click

```tsx
<Link
  href="/leads"
  onClick={() => trackDashboardEvent("shortcut_leads_click", {
    destination: "/leads",
  }, user?.id, role || undefined)}
>
  Leads
</Link>
```

## Development vs Production

In development mode, events are logged to console instead of being sent to the backend:

```typescript
if (process.env.NODE_ENV === "development") {
  console.log("[Dashboard Analytics]", eventType, metadata);
  return;
}
```

To enable tracking in development, remove this check from `src/lib/dashboard-tracking.ts`.

## Privacy Considerations

- Events are anonymous by default (no personally identifiable information)
- User ID is only tracked for authenticated users
- Session IDs are generated client-side using `crypto.randomUUID()`
- Metadata should NOT include sensitive user data (passwords, tokens, etc.)

## Querying Analytics

Platform admins can query the `dashboard_analytics` table directly from Supabase:

```sql
-- Most popular shortcuts (last 7 days)
SELECT
  event_type,
  COUNT(*) as clicks,
  COUNT(DISTINCT user_id) as unique_users
FROM dashboard_analytics
WHERE
  event_type LIKE 'shortcut_%'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY clicks DESC;

-- Project CRUD activity by day
SELECT
  DATE(created_at) as date,
  event_type,
  COUNT(*) as events
FROM dashboard_analytics
WHERE
  event_type IN ('project_create', 'project_edit', 'project_delete', 'project_clone')
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type
ORDER BY date DESC;

-- Search queries (most common terms)
SELECT
  metadata->>'query' as search_query,
  COUNT(*) as search_count
FROM dashboard_analytics
WHERE event_type = 'projects_search'
GROUP BY metadata->>'query'
ORDER BY search_count DESC
LIMIT 20;
```

## Future Enhancements

- [ ] Analytics dashboard UI for visualizing tracked events
- [ ] Funnel analysis (creation → publish flow)
- [ ] Heatmaps for table interactions
- [ ] Export analytics data to CSV
- [ ] A/B testing framework
- [ ] User session replay
