import { createAdminClient } from "@/lib/supabase/admin";
import type { ActivityCategory } from "@/types";

/**
 * Activity logging for NODDO Bitácora
 * Records user-facing business events (project changes, sales, leads, etc.)
 *
 * Uses service role to bypass RLS. Follows the same fire-and-forget pattern as audit.ts.
 */

export interface ActivityLogParams {
  userId: string;
  userEmail: string;
  userName?: string | null;
  userRole: "admin" | "administrador" | "director" | "asesor";
  proyectoId?: string | null;
  proyectoNombre?: string | null;
  actionType: string;
  actionCategory: ActivityCategory;
  metadata?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
}

/* ── Description generator ─────────────────────────────────────────────── */

function desc(params: ActivityLogParams): { es: string; en: string } {
  const { actionType: a, metadata: m = {}, proyectoNombre: p } = params;

  // -- Project --
  if (a === "project.create") return { es: `Creó el proyecto "${p}"`, en: `Created project "${p}"` };
  if (a === "project.update") {
    const fields = (m.changedFields as string[]) || [];
    if (fields.length === 0) return { es: `Actualizó "${p}"`, en: `Updated "${p}"` };
    const labels: Record<string, { es: string; en: string }> = {
      nombre: { es: "nombre", en: "name" },
      slug: { es: "slug", en: "slug" },
      descripcion: { es: "descripción", en: "description" },
      estado: { es: "estado", en: "status" },
      color_primario: { es: "color primario", en: "primary color" },
      color_secundario: { es: "color secundario", en: "secondary color" },
      color_fondo: { es: "color de fondo", en: "background color" },
      logo_url: { es: "logo", en: "logo" },
      favicon_url: { es: "favicon", en: "favicon" },
      og_image_url: { es: "imagen OG", en: "OG image" },
      render_principal_url: { es: "render principal", en: "main render" },
      hero_video_url: { es: "video hero", en: "hero video" },
      whatsapp_numero: { es: "WhatsApp", en: "WhatsApp" },
      ubicacion_direccion: { es: "ubicación", en: "location" },
      ubicacion_lat: { es: "coordenadas", en: "coordinates" },
      ubicacion_lng: { es: "coordenadas", en: "coordinates" },
      brochure_url: { es: "brochure", en: "brochure" },
      tour_360_url: { es: "tour 360", en: "360 tour" },
      constructora_nombre: { es: "constructora", en: "developer" },
      constructora_logo_url: { es: "logo constructora", en: "developer logo" },
      subdomain: { es: "subdominio", en: "subdomain" },
      custom_domain: { es: "dominio personalizado", en: "custom domain" },
      disclaimer: { es: "disclaimer", en: "disclaimer" },
      email_config: { es: "configuración de correos", en: "email config" },
      webhook_config: { es: "webhooks", en: "webhooks" },
      cotizador_enabled: { es: "NodDo Quote", en: "NodDo Quote" },
      cotizador_config: { es: "configuración NodDo Quote", en: "NodDo Quote config" },
      secciones_visibles: { es: "secciones visibles", en: "visible sections" },
      inventory_columns: { es: "columnas de inventario", en: "inventory columns" },
      tipo_proyecto: { es: "tipo de proyecto", en: "project type" },
      moneda_base: { es: "moneda", en: "currency" },
      idioma: { es: "idioma", en: "language" },
      etapa_label: { es: "etapa", en: "stage" },
      background_audio_url: { es: "audio de fondo", en: "background audio" },
      fachada_url: { es: "fachada", en: "facade" },
      mapa_ubicacion_url: { es: "mapa de ubicación", en: "location map" },
      disponibilidad_config: { es: "config. disponibilidad", en: "availability config" },
      estado_construccion: { es: "estado de construcción", en: "construction status" },
      precio_source: { es: "fuente de precios", en: "price source" },
    };
    // Deduplicate labels (e.g. ubicacion_lat + ubicacion_lng both map to "coordenadas")
    const labelObjs = fields.map((f) => labels[f] || { es: f, en: f });
    const seen = new Set<string>();
    const uniqueLabels = labelObjs.filter((l) => {
      const key = typeof l === "string" ? l : l.es;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (uniqueLabels.length <= 3) {
      const esNames = uniqueLabels.map((l) => (typeof l === "string" ? l : l.es)).join(", ");
      const enNames = uniqueLabels.map((l) => (typeof l === "string" ? l : l.en)).join(", ");
      return { es: `Actualizó ${esNames} de "${p}"`, en: `Updated ${enNames} of "${p}"` };
    }
    return {
      es: `Actualizó ${fields.length} campos de "${p}"`,
      en: `Updated ${fields.length} fields of "${p}"`,
    };
  }
  if (a === "project.delete") return { es: `Eliminó el proyecto "${m.nombre || p}"`, en: `Deleted project "${m.nombre || p}"` };
  if (a === "project.publish") return { es: `Publicó "${p}"`, en: `Published "${p}"` };
  if (a === "project.unpublish") return { es: `Despublicó "${p}"`, en: `Unpublished "${p}"` };
  if (a === "project.clone") return { es: `Clonó "${p}"`, en: `Cloned "${p}"` };
  if (a === "project.restore") return { es: `Restauró versión de "${p}"`, en: `Restored version of "${p}"` };

  // -- Unit --
  if (a === "unit.create") {
    const count = (m.count as number) || 1;
    if (count > 1) return { es: `Creó ${count} unidades en "${p}"`, en: `Created ${count} units in "${p}"` };
    return { es: `Creó unidad ${m.identificador || ""} en "${p}"`, en: `Created unit ${m.identificador || ""} in "${p}"` };
  }
  if (a === "unit.update") return { es: `Actualizó unidad ${m.identificador || ""} en "${p}"`, en: `Updated unit ${m.identificador || ""} in "${p}"` };
  if (a === "unit.state_change") {
    let es = `Cambió ${m.identificador} de ${m.estadoAnterior} a ${m.estadoNuevo}`;
    let en = `Changed ${m.identificador} from ${m.estadoAnterior} to ${m.estadoNuevo}`;
    if (m.price_discrepancy) { es += " (precio difiere de cotización)"; en += " (price differs from quote)"; }
    if (m.sold_without_client) { es += " (sin cliente)"; en += " (without client)"; }
    return { es, en };
  }
  if (a === "unit.price_change") return { es: `Cambió precio de ${m.identificador}: $${fmt(m.precioAnterior)} → $${fmt(m.precioNuevo)}`, en: `Changed price of ${m.identificador}: $${fmt(m.precioAnterior)} → $${fmt(m.precioNuevo)}` };
  if (a === "unit.delete") return { es: `Eliminó unidad ${m.identificador || ""} de "${p}"`, en: `Deleted unit ${m.identificador || ""} from "${p}"` };
  if (a === "unit.bulk_create") return { es: `Creó ${m.count} unidades en "${p}"`, en: `Created ${m.count} units in "${p}"` };

  // -- Tipología --
  if (a === "tipologia.create") return { es: `Creó tipología "${m.nombre}" en "${p}"`, en: `Created typology "${m.nombre}" in "${p}"` };
  if (a === "tipologia.update") return { es: `Actualizó tipología "${m.nombre}" en "${p}"`, en: `Updated typology "${m.nombre}" in "${p}"` };
  if (a === "tipologia.delete") return { es: `Eliminó tipología "${m.nombre}" de "${p}"`, en: `Deleted typology "${m.nombre}" from "${p}"` };
  if (a === "tipologia.clone") return { es: `Clonó tipología "${m.nombre}" en "${p}"`, en: `Cloned typology "${m.nombre}" in "${p}"` };

  // -- Gallery --
  if (a === "gallery.category_create") return { es: `Creó categoría "${m.nombre}" en galería de "${p}"`, en: `Created category "${m.nombre}" in "${p}" gallery` };
  if (a === "gallery.category_update") return { es: `Actualizó categoría "${m.nombre}" en galería de "${p}"`, en: `Updated category "${m.nombre}" in "${p}" gallery` };
  if (a === "gallery.category_delete") return { es: `Eliminó categoría "${m.nombre}" de galería de "${p}"`, en: `Deleted category "${m.nombre}" from "${p}" gallery` };
  if (a === "gallery.images_upload") return { es: `Subió ${m.count} imagen(es) a "${p}"`, en: `Uploaded ${m.count} image(s) to "${p}"` };
  if (a === "gallery.image_delete") return { es: `Eliminó imagen de galería en "${p}"`, en: `Deleted gallery image in "${p}"` };

  // -- Video --
  if (a === "video.create") return { es: `Agregó video "${m.titulo || ""}" en "${p}"`, en: `Added video "${m.titulo || ""}" in "${p}"` };
  if (a === "video.update") return { es: `Actualizó video en "${p}"`, en: `Updated video in "${p}"` };
  if (a === "video.delete") return { es: `Eliminó video de "${p}"`, en: `Deleted video from "${p}"` };

  // -- Lead --
  if (a === "lead.new") return { es: `Nuevo lead: ${m.nombre} (${m.email}) en "${p}"`, en: `New lead: ${m.nombre} (${m.email}) in "${p}"` };
  if (a === "lead.status_change") return { es: `Cambió lead ${m.nombre}: ${m.statusAnterior} → ${m.statusNuevo}`, en: `Changed lead ${m.nombre}: ${m.statusAnterior} → ${m.statusNuevo}` };
  if (a === "lead.assign") return { es: `Asignó lead ${m.nombre} a ${m.asignado_nombre || "nadie"}`, en: `Assigned lead ${m.nombre} to ${m.asignado_nombre || "nobody"}` };

  // -- Cotización --
  if (a === "cotizacion.create") return { es: `Generó cotización para ${m.buyerName || m.email} en "${p}"`, en: `Generated quote for ${m.buyerName || m.email} in "${p}"` };
  if (a === "cotizacion.regenerate") return { es: `Regeneró cotización en "${p}"`, en: `Regenerated quote in "${p}"` };
  if (a === "cotizacion.resend") return { es: `Reenvió cotización a ${m.email}`, en: `Resent quote to ${m.email}` };

  // -- Colaborador --
  if (a === "colaborador.invite") return { es: `Invitó a ${m.email} como colaborador`, en: `Invited ${m.email} as collaborator` };
  if (a === "colaborador.remove") return { es: `Eliminó colaborador ${m.email}`, en: `Removed collaborator ${m.email}` };
  if (a === "colaborador.update") return { es: `Actualizó colaborador ${m.email}`, en: `Updated collaborator ${m.email}` };
  if (a === "colaborador.assign_projects") return { es: `Asignó proyectos a ${m.email}`, en: `Assigned projects to ${m.email}` };

  // -- Content (fachadas, torres, planos, avances, etc.) --
  if (a === "torre.create") return { es: `Creó torre "${m.nombre}" en "${p}"`, en: `Created tower "${m.nombre}" in "${p}"` };
  if (a === "torre.update") return { es: `Actualizó torre "${m.nombre}" en "${p}"`, en: `Updated tower "${m.nombre}" in "${p}"` };
  if (a === "torre.delete") return { es: `Eliminó torre de "${p}"`, en: `Deleted tower from "${p}"` };
  if (a === "fachada.create") return { es: `Agregó fachada en "${p}"`, en: `Added facade in "${p}"` };
  if (a === "fachada.update") return { es: `Actualizó fachada en "${p}"`, en: `Updated facade in "${p}"` };
  if (a === "fachada.delete") return { es: `Eliminó fachada de "${p}"`, en: `Deleted facade from "${p}"` };
  if (a === "plano.create") return { es: `Agregó plano en "${p}"`, en: `Added floor plan in "${p}"` };
  if (a === "plano.update") return { es: `Actualizó plano en "${p}"`, en: `Updated floor plan in "${p}"` };
  if (a === "plano.delete") return { es: `Eliminó plano de "${p}"`, en: `Deleted floor plan from "${p}"` };
  if (a === "avance.create") return { es: `Agregó avance de obra en "${p}"`, en: `Added construction update in "${p}"` };
  if (a === "avance.update") return { es: `Actualizó avance de obra en "${p}"`, en: `Updated construction update in "${p}"` };
  if (a === "avance.delete") return { es: `Eliminó avance de obra de "${p}"`, en: `Deleted construction update from "${p}"` };
  if (a === "recurso.create") return { es: `Agregó recurso "${m.nombre || ""}" en "${p}"`, en: `Added resource "${m.nombre || ""}" in "${p}"` };
  if (a === "recurso.delete") return { es: `Eliminó recurso de "${p}"`, en: `Deleted resource from "${p}"` };
  if (a === "complemento.create") {
    const count = (m.count as number) || 1;
    if (count > 1) return { es: `Creó ${count} ${m.tipo || "complementos"} en "${p}"`, en: `Created ${count} ${m.tipo || "complements"} in "${p}"` };
    return { es: `Creó ${m.tipo || "complemento"} ${m.identificador || ""} en "${p}"`, en: `Created ${m.tipo || "complement"} ${m.identificador || ""} in "${p}"` };
  }
  if (a === "complemento.delete") return { es: `Eliminó ${m.tipo || "complemento"} ${m.identificador || ""} de "${p}"`, en: `Deleted ${m.tipo || "complement"} ${m.identificador || ""} from "${p}"` };

  // -- POI --
  if (a === "poi.create") return { es: `Agregó punto de interés "${m.nombre || ""}" en "${p}"`, en: `Added POI "${m.nombre || ""}" in "${p}"` };
  if (a === "poi.delete") return { es: `Eliminó punto de interés de "${p}"`, en: `Deleted POI from "${p}"` };

  // Fallback
  return { es: `Acción: ${a}`, en: `Action: ${a}` };
}

function fmt(v: unknown): string {
  if (typeof v === "number") return v.toLocaleString("es-CO");
  return String(v ?? "");
}

/* ── Public API ─────────────────────────────────────────────────────────── */

/**
 * Log a single activity event.
 *
 * NEVER throws — activity logging must not break core functionality.
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { es: description, en: description_en } = desc(params);

    const { error } = await supabase.from("activity_logs").insert({
      user_id: params.userId,
      user_email: params.userEmail,
      user_name: params.userName || null,
      user_role: params.userRole,
      proyecto_id: params.proyectoId || null,
      proyecto_nombre: params.proyectoNombre || null,
      action_type: params.actionType,
      action_category: params.actionCategory,
      description,
      description_en,
      metadata: params.metadata || {},
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
    });

    if (error) console.error("[activity] Failed to log:", error);
  } catch (err) {
    console.error("[activity] Exception:", err);
  }
}

/**
 * Batch log multiple activity events (for bulk operations).
 */
export async function logActivityBatch(events: ActivityLogParams[]): Promise<void> {
  if (events.length === 0) return;
  try {
    const supabase = createAdminClient();
    const rows = events.map((e) => {
      const { es: description, en: description_en } = desc(e);
      return {
        user_id: e.userId,
        user_email: e.userEmail,
        user_name: e.userName || null,
        user_role: e.userRole,
        proyecto_id: e.proyectoId || null,
        proyecto_nombre: e.proyectoNombre || null,
        action_type: e.actionType,
        action_category: e.actionCategory,
        description,
        description_en,
        metadata: e.metadata || {},
        entity_type: e.entityType || null,
        entity_id: e.entityId || null,
      };
    });

    const { error } = await supabase.from("activity_logs").insert(rows);
    if (error) console.error("[activity] Failed to batch log:", error);
  } catch (err) {
    console.error("[activity] Batch exception:", err);
  }
}
