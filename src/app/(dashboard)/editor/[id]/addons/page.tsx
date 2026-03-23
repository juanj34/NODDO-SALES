"use client";

export const dynamic = "force-dynamic";

import { useEditorProject } from "@/hooks/useEditorProject";
import { ComplementosSection } from "@/components/dashboard/ComplementosSection";

export default function AddonsPage() {
  const { project, refresh } = useEditorProject();

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div>
        <h2 className="text-xl font-heading text-[var(--text-primary)]">Addons</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Extras opcionales para el cotizador (jacuzzi, amoblado, etc.)
        </p>
      </div>
      <ComplementosSection
        project={project}
        onRefresh={refresh}
        fixedTab="addon"
      />
    </div>
  );
}
