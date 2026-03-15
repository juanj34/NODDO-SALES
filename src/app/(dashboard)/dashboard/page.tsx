"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjects, useDashboardSummary } from "@/hooks/useProjectsQuery";
import { Loader2 } from "lucide-react";
import { useAuthRole } from "@/hooks/useAuthContext";
import { trackDashboardEvent } from "@/lib/dashboard-tracking";

import { DashboardGreeting } from "@/components/dashboard/home/DashboardGreeting";
import { DashboardKPIStrip } from "@/components/dashboard/home/DashboardKPIStrip";
import { DashboardShortcutsEnhanced } from "@/components/dashboard/home/DashboardShortcutsEnhanced";
import { RecentProjectsPreview } from "@/components/dashboard/home/RecentProjectsPreview";

export default function DashboardPage() {
  const { data: projects = [], isLoading: loading, refetch: refresh } = useProjects();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const [kpiProjectFilter, setKpiProjectFilter] = useState<string | null>(null);
  const router = useRouter();
  const { user, role } = useAuthRole();
  const isAdmin = role === "admin";

  // Track page view
  useEffect(() => {
    if (!loading) {
      trackDashboardEvent("dashboard_view", {
        projects_count: projects.length,
        total_leads: summary?.total_leads || 0,
      }, user?.id, role || undefined);
    }
  }, [loading, projects.length, summary?.total_leads, user?.id, role]);

  // Simple delete handler (navigates to /proyectos for actual deletion)
  const handleDelete = (id: string) => {
    router.push(`/proyectos?delete=${id}`);
  };

  // Simple clone handler
  const handleClone = async (id: string) => {
    try {
      const res = await fetch(`/api/proyectos/${id}/clonar`, { method: "POST" });
      if (res.ok) {
        refresh();
      }
    } catch (err) {
      console.error("Clone error:", err);
    }
  };

  // Navigate to create project page
  const handleCreateProject = () => {
    router.push("/proyectos?create=true");
  };

  if (loading || summaryLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Greeting */}
      <DashboardGreeting
        userEmail={user?.email || ""}
        isAdmin={isAdmin}
        onCreateClick={handleCreateProject}
      />

      {/* 2. KPI Strip (admin only, if has projects) */}
      {isAdmin && projects.length > 0 && summary && (
        <DashboardKPIStrip
          data={summary}
          projects={projects}
          selectedProjectId={kpiProjectFilter}
          onSelectProject={setKpiProjectFilter}
        />
      )}

      {/* 3. Enhanced Shortcuts (admin only, if has projects) */}
      {isAdmin && projects.length > 0 && (
        <DashboardShortcutsEnhanced leadCount={summary?.total_leads} />
      )}

      {/* 4. Recent Projects Preview */}
      <RecentProjectsPreview
        projects={projects}
        totalCount={projects.length}
        isAdmin={isAdmin}
        onDelete={handleDelete}
        onClone={isAdmin ? handleClone : undefined}
        onCreateProject={isAdmin ? handleCreateProject : undefined}
      />
    </div>
  );
}
