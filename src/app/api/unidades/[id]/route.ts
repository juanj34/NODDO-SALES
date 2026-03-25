import { pick } from "@/lib/api-utils";
import { getAuthContext, getAccessibleProjectIds, verifyProjectOwnership, requirePermission } from "@/lib/auth-context";
import { logActivity } from "@/lib/activity-logger";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Lookup the unidad to get its proyecto_id for ownership check
    const { data: unidad } = await auth.supabase
      .from("unidades")
      .select("proyecto_id, tipologia_id, estado, precio")
      .eq("id", id)
      .maybeSingle();
    if (!unidad) {
      return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
    }
    const proyectoId = unidad.proyecto_id;

    // Asesores can ONLY update estado; Directors have full inventory access
    if (auth.role === "asesor") {
      const allowedKeys = ["estado"];
      const bodyKeys = Object.keys(body);
      if (bodyKeys.some((k) => !allowedKeys.includes(k))) {
        return NextResponse.json(
          { error: "Solo puedes actualizar el estado de la unidad" },
          { status: 403 }
        );
      }
      const accessible = await getAccessibleProjectIds(auth);
      if (accessible && !accessible.includes(proyectoId)) {
        return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
      }
    } else if (auth.role === "director") {
      const accessible = await getAccessibleProjectIds(auth);
      if (accessible && !accessible.includes(proyectoId)) {
        return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
      }
    } else {
      // Admin: verify project ownership
      if (!(await verifyProjectOwnership(auth, proyectoId))) {
        return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
      }
    }

    // Block tipología change on vendida units
    if (unidad.estado === "vendida" && body.tipologia_id !== undefined && body.tipologia_id !== unidad.tipologia_id) {
      return NextResponse.json(
        { error: "No se puede cambiar la tipología de una unidad vendida", code: "VENDIDA_TIPOLOGIA_LOCKED" },
        { status: 422 }
      );
    }

    // --- Compute precio_venta override BEFORE the main update ---
    // This ensures the trigger captures precio_venta in the same transaction
    let precioVentaOverride: Record<string, unknown> = {};
    let proyecto: { tipologia_mode?: string; parqueaderos_mode?: string; depositos_mode?: string; precio_source?: string; disponibilidad_config?: Record<string, boolean> } | null = null;

    if (body.estado !== undefined) {
      const { data: proj } = await auth.supabase
        .from("proyectos")
        .select("tipologia_mode, parqueaderos_mode, depositos_mode, precio_source, disponibilidad_config")
        .eq("id", proyectoId)
        .single();
      proyecto = proj;

      const isCommitting = ["separado", "reservada", "vendida"].includes(body.estado);
      const wasCommitted = ["separado", "reservada", "vendida"].includes(unidad.estado);
      const isReverting = wasCommitted && ["disponible", "proximamente"].includes(body.estado);

      if (isCommitting && !wasCommitted) {
        // Transitioning to a committed state — set precio_venta
        if (body.precio_venta !== undefined && body.precio_venta !== null) {
          // Explicit precio_venta provided by the user
          precioVentaOverride = { precio_venta: parseFloat(body.precio_venta) };
        } else {
          // Auto-compute from tipologia or unit price
          let precioVenta: number | null = null;
          if (proyecto?.precio_source === "tipologia") {
            const tipId = body.tipologia_id ?? unidad.tipologia_id;
            if (tipId) {
              const { data: tip } = await auth.supabase
                .from("tipologias")
                .select("precio_desde")
                .eq("id", tipId)
                .single();
              precioVenta = tip?.precio_desde ?? null;
            }
          } else {
            precioVenta = body.precio != null ? parseFloat(body.precio) : unidad.precio ?? null;
          }
          if (precioVenta !== null) {
            precioVentaOverride = { precio_venta: precioVenta };
          }
        }
      } else if (isCommitting && wasCommitted && body.precio_venta !== undefined) {
        // Moving between committed states (e.g. separado → vendida) with explicit price
        precioVentaOverride = { precio_venta: body.precio_venta !== null ? parseFloat(body.precio_venta) : null };
      } else if (isReverting) {
        // Reverting to disponible/proximamente — clear sale data
        precioVentaOverride = { precio_venta: null, lead_id: null, cotizacion_id: null };
      }
    }

    // Strip manual precio_venta from body for non-vendida units (guard)
    const pickedBody = pick(body, ["tipologia_id", "identificador", "piso", "area_m2", "area_construida", "area_privada", "area_lote", "precio", "precio_venta", "estado", "habitaciones", "banos", "orientacion", "vista", "vista_piso_id", "notas", "plano_url", "fachada_id", "fachada_x", "fachada_y", "planta_id", "planta_x", "planta_y", "torre_id", "lote", "etapa_nombre", "parqueaderos", "depositos", "orden", "custom_fields", "lead_id", "cotizacion_id"]);

    // Only allow manual precio_venta for units that are/will be in a committed state
    if (pickedBody.precio_venta !== undefined) {
      const currentEstado = body.estado ?? unidad.estado;
      const isCommitted = ["separado", "reservada", "vendida"].includes(currentEstado);
      if (!isCommitted) {
        delete pickedBody.precio_venta;
      }
    }

    // Only allow lead_id/cotizacion_id for committed states
    if (pickedBody.lead_id !== undefined || pickedBody.cotizacion_id !== undefined) {
      const currentEstado = body.estado ?? unidad.estado;
      const isCommitted = ["separado", "reservada", "vendida"].includes(currentEstado);
      if (!isCommitted) {
        delete pickedBody.lead_id;
        delete pickedBody.cotizacion_id;
      }
    }

    // Merge: auto-computed precioVentaOverride takes precedence over manual body
    const updatePayload = { ...pickedBody, ...precioVentaOverride };

    const { data, error } = await auth.supabase
      .from("unidades")
      .update(updatePayload)
      .eq("id", id)
      .select("*, tipologias(parqueaderos, depositos)")
      .single();

    if (error) throw error;

    // Update available tipologías if provided (multi-tipología mode)
    if (Array.isArray(body.available_tipologia_ids)) {
      // Delete existing and re-insert
      await auth.supabase.from("unidad_tipologias").delete().eq("unidad_id", id);
      if (body.available_tipologia_ids.length > 0) {
        const junctionRows = body.available_tipologia_ids.map((tid: string) => ({
          proyecto_id: proyectoId,
          unidad_id: id,
          tipologia_id: tid,
        }));
        await auth.supabase.from("unidad_tipologias").insert(junctionRows);
      }
    }

    // Validate tipología selection when changing estado in multi-tipología mode
    if (body.estado !== undefined && ["separado", "reservada", "vendida"].includes(body.estado)) {
      if (!proyecto) {
        const { data: proj } = await auth.supabase
          .from("proyectos")
          .select("tipologia_mode")
          .eq("id", proyectoId)
          .single();
        proyecto = proj;
      }
      if (proyecto?.tipologia_mode === "multiple" && !data.tipologia_id && body.tipologia_id === undefined) {
        // Check if this unit has available tipologías
        const { count } = await auth.supabase
          .from("unidad_tipologias")
          .select("id", { count: "exact", head: true })
          .eq("unidad_id", id);
        if (count && count > 0) {
          return NextResponse.json(
            { error: "Debe seleccionar una tipología antes de cambiar el estado", code: "TIPOLOGIA_REQUIRED" },
            { status: 422 }
          );
        }
      }
    }

    // Validate disponibilidad_config requirements for committed states
    if (body.estado !== undefined && ["separado", "reservada", "vendida"].includes(body.estado) && auth.role === "admin") {
      const dispConfig = (proyecto?.disponibilidad_config ?? {}) as Record<string, boolean>;
      if (dispConfig.require_lead_on_commit && !body.lead_id && !data.lead_id) {
        return NextResponse.json(
          { error: "Debe asignar un cliente antes de comprometer la unidad", code: "LEAD_REQUIRED" },
          { status: 422 }
        );
      }
      if (dispConfig.require_cotizacion_on_commit && !body.cotizacion_id && !data.cotizacion_id) {
        return NextResponse.json(
          { error: "Debe vincular una cotización antes de comprometer la unidad", code: "COTIZACION_REQUIRED" },
          { status: 422 }
        );
      }
    }

    // Cascade estado to assigned complementos + pre-sale validation
    let complementosCascaded = 0;
    const _warnings: string[] = [];

    if (body.estado !== undefined) {
      const parqMode = proyecto?.parqueaderos_mode ?? "sin_inventario";
      const depoMode = proyecto?.depositos_mode ?? "sin_inventario";
      const parqInventory = parqMode === "inventario_incluido" || parqMode === "inventario_separado";
      const depoInventory = depoMode === "inventario_incluido" || depoMode === "inventario_separado";

      if (parqInventory || depoInventory) {
        // Cascade estado
        const { data: cascaded } = await auth.supabase
          .from("complementos")
          .update({ estado: body.estado })
          .eq("unidad_id", id)
          .select("id, tipo");
        complementosCascaded = cascaded?.length ?? 0;

        // Pre-sale warning: check if required complementos are assigned
        if (body.estado === "vendida") {
          const tipData = data.tipologias as unknown as { parqueaderos: number | null; depositos: number | null } | null;
          const expectedParq = data.parqueaderos ?? tipData?.parqueaderos ?? 0;
          const expectedDepo = data.depositos ?? tipData?.depositos ?? 0;
          const assignedParq = cascaded?.filter((c: { tipo: string }) => c.tipo === "parqueadero").length ?? 0;
          const assignedDepo = cascaded?.filter((c: { tipo: string }) => c.tipo === "deposito").length ?? 0;

          if (parqInventory && assignedParq < expectedParq) {
            _warnings.push(`Faltan ${expectedParq - assignedParq} parqueadero(s) por asignar`);
          }
          if (depoInventory && assignedDepo < expectedDepo) {
            _warnings.push(`Faltan ${expectedDepo - assignedDepo} depósito(s) por asignar`);
          }
        }
      }
    }

    // Log activity — detect estado and price changes
    const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", proyectoId).single();
    if (body.estado !== undefined) {
      logActivity({
        userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
        proyectoId, proyectoNombre: proj?.nombre,
        actionType: "unit.state_change", actionCategory: "unit",
        metadata: { identificador: data.identificador, estadoNuevo: body.estado },
        entityType: "unidad", entityId: id,
      });
    } else {
      logActivity({
        userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
        proyectoId, proyectoNombre: proj?.nombre,
        actionType: "unit.update", actionCategory: "unit",
        metadata: { identificador: data.identificador },
        entityType: "unidad", entityId: id,
      });
    }

    // Strip tipologias join from response
    const { tipologias: _tip, ...responseData } = data as Record<string, unknown>;
    return NextResponse.json({ ...responseData, _complementos_cascaded: complementosCascaded, _warnings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const denied = requirePermission(auth, "inventory.write");
    if (denied) return denied;

    const { error } = await auth.supabase
      .from("unidades")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
