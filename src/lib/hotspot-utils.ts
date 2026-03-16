/**
 * Resolve the ordered image array for a hotspot.
 * Falls back to render_url / imagen_url for backward compat.
 */
export function resolveHotspotImages(item: {
  render_url?: string | null;
  renders?: string[];
  imagen_url?: string | null;
}): string[] {
  if (item.renders && item.renders.length > 0) return item.renders;
  if (item.render_url) return [item.render_url];
  if (item.imagen_url) return [item.imagen_url];
  return [];
}

/**
 * Keep render_url in sync with renders[0] for backward compat.
 */
export function syncRenderUrl(renders: string[]): string {
  return renders[0] || "";
}
