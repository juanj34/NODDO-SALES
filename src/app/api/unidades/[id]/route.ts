import { pick } from "@/lib/api-utils";
import { getAuthContext, getAccessibleProjectIds, verifyProjectOwnership } from "@/lib/auth-context";
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
      .select("tipologia_id, tipologias(proyecto_id)")
      .eq("id", id)
      .maybeSingle();
    if (!unidad) {
      return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
    }
    const proyectoId = (unidad.tipologias as unknown as { proyecto_id: string })?.proyecto_id;

    // Collaborators can ONLY update estado
    if (auth.role === "colaborador") {
      const allowedKeys = ["estado"];
      const bodyKeys = Object.keys(body);
      if (bodyKeys.some((k) => !allowedKeys.includes(k))) {
        return NextResponse.json(
          { error: "Solo puedes actualizar el estado de la unidad" },
          { status: 403 }
        );
      }
      // Verify collaborator has access to this project
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

    const { data, error } = await auth.supabase
      .from("unidades")
      .update(pick(body, ["tipologia_id", "identificador", "piso", "area_m2", "precio", "estado", "habitaciones", "banos", "orientacion", "vista", "vista_piso_id", "notas", "fachada_id", "fachada_x", "fachada_y", "planta_id", "planta_x", "planta_y", "torre_id", "parqueaderos", "depositos", "orden"]))
      .eq("id", id)
      .select("*, tipologias(parqueaderos, depositos)")
      .single();

    if (error) throw error;

    // Cascade estado to assigned complementos + pre-sale validation
    let complementosCascaded = 0;
    const _warnings: string[] = [];

    if (body.estado !== undefined) {
      const { data: proyecto } = await auth.supabase
        .from("proyectos")
        .select("parqueaderos_mode, depositos_mode")
        .eq("id", proyectoId)
        .single();

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
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

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
