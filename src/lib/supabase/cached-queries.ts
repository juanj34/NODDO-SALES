/**
 * Cached Supabase queries for better performance
 * Uses Next.js unstable_cache for granular revalidation
 */

import { unstable_cache } from "next/cache";
import { getProyectoBySlug as _getProyectoBySlug } from "./server-queries";
import type { ProyectoCompleto } from "@/types";

/**
 * Cached version of getProyectoBySlug
 *
 * Cache strategy:
 * - TTL: 1 hour (projects don't change frequently)
 * - Tag: 'proyecto-{slug}' for granular revalidation
 *
 * Revalidate on:
 * - Project update: revalidateTag(`proyecto-${slug}`)
 * - Project publish: revalidateTag(`proyecto-${slug}`)
 */
export const getProyectoBySlug = (slug: string) =>
  unstable_cache(
    async () => _getProyectoBySlug(slug),
    [`proyecto-${slug}`],
    {
      revalidate: 3600, // 1 hour
      tags: [`proyecto-${slug}`, "proyectos"],
    }
  )();

/**
 * Helper to revalidate a specific project
 * Call this after project updates
 */
export async function revalidateProyecto(slug: string) {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(`proyecto-${slug}`, { expire: 0 });
}

/**
 * Helper to revalidate all projects
 * Use sparingly - only for global changes
 */
export async function revalidateAllProyectos() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("proyectos", { expire: 0 });
}
