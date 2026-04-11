"use client";

import { useMemo } from "react";
import { useEditorProject } from "./useEditorProject";
import {
  isFeatureAvailable,
  getLockedFeatures,
  getPlanTier,
  type ProjectPlan,
  type GatedFeature,
} from "@/lib/plan-config";

interface PlanGateResult {
  plan: ProjectPlan;
  isAvailable: (feature: GatedFeature) => boolean;
  lockedFeatures: GatedFeature[];
  tierConfig: ReturnType<typeof getPlanTier>;
}

/**
 * Hook to check feature availability based on the current project's plan.
 * Must be used within the EditorProjectContext.
 */
export function usePlanGate(): PlanGateResult {
  const { project } = useEditorProject();
  const plan = (project.plan ?? "basico") as ProjectPlan;

  return useMemo(() => ({
    plan,
    isAvailable: (feature: GatedFeature) => isFeatureAvailable(plan, feature),
    lockedFeatures: getLockedFeatures(plan),
    tierConfig: getPlanTier(plan),
  }), [plan]);
}
