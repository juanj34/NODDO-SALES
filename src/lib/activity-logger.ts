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
  userRole: "admin" | "colaborador";
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
  if (a === "project.update") return { es: `Actualizó el proyecto "${p}"`, en: `Updated project "${p}"` };
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
  if (a === "unit.state_change") return { es: `Cambió ${m.identificador} de ${m.estadoAnterior} a ${m.estadoNuevo}`, en: `Changed ${m.identificador} from ${m.estadoAnterior} to ${m.estadoNuevo}` };
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
  if (a === "plano.delete") return { es: `Eliminó plano de "${p}"`, en: `Deleted floor plan from "${p}"` };
  if (a === "avance.create") return { es: `Agregó avance de obra en "${p}"`, en: `Added construction update in "${p}"` };
  if (a === "avance.update") return { es: `Actualizó avance de obra en "${p}"`, en: `Updated construction update in "${p}"` };
  if (a === "avance.delete") return { es: `Eliminó avance de obra de "${p}"`, en: `Deleted construction update from "${p}"` };
  if (a === "recurso.create") return { es: `Agregó recurso "${m.nombre || ""}" en "${p}"`, en: `Added resource "${m.nombre || ""}" in "${p}"` };
  if (a === "recurso.delete") return { es: `Eliminó recurso de "${p}"`, en: `Deleted resource from "${p}"` };
  if (a === "complemento.create") return { es: `Creó ${m.tipo || "complemento"} ${m.identificador || ""} en "${p}"`, en: `Created ${m.tipo || "complement"} ${m.identificador || ""} in "${p}"` };
  if (a === "complemento.delete") return { es: `Eliminó ${m.tipo || "complemento"} de "${p}"`, en: `Deleted ${m.tipo || "complement"} from "${p}"` };

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
