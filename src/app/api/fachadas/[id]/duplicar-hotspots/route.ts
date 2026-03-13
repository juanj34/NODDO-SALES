import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

/**
 * Smart hotspot duplication: copies unit positions from one planta (floor)
 * to another, pattern-matching identifiers (e.g., TP-201 -> TP-301).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceFachadaId } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { target_fachada_id } = await request.json();
    if (!target_fachada_id) {
      return NextResponse.json(
        { error: "target_fachada_id es requerido" },
        { status: 400 }
      );
    }

    // 1. Get source fachada
    const { data: sourceFachada } = await auth.supabase
      .from("fachadas")
      .select("id, piso_numero, torre_id, proyecto_id")
      .eq("id", sourceFachadaId)
      .single();

    if (!sourceFachada) {
      return NextResponse.json(
        { error: "Fachada origen no encontrada" },
        { status: 404 }
      );
    }

    // 2. Get target fachada
    const { data: targetFachada } = await auth.supabase
      .from("fachadas")
      .select("id, piso_numero, torre_id")
      .eq("id", target_fachada_id)
      .single();

    if (!targetFachada) {
      return NextResponse.json(
        { error: "Fachada destino no encontrada" },
        { status: 404 }
      );
    }

    if (sourceFachada.piso_numero == null || targetFachada.piso_numero == null) {
      return NextResponse.json(
        { error: "Ambas fachadas deben tener piso_numero definido" },
        { status: 400 }
      );
    }

    // Determine if source is a planta (use planta_id/x/y fields)
    const { data: sourceFachadaFull } = await auth.supabase
      .from("fachadas")
      .select("tipo")
      .eq("id", sourceFachadaId)
      .single();
    const isPlanta = sourceFachadaFull?.tipo === "planta";

    // 3. Get all units positioned on the source fachada/planta
    const posIdCol = isPlanta ? "planta_id" : "fachada_id";
    const posXCol = isPlanta ? "planta_x" : "fachada_x";
    const posYCol = isPlanta ? "planta_y" : "fachada_y";

    const { data: sourceUnits } = await auth.supabase
      .from("unidades")
      .select(`id, identificador, ${posXCol}, ${posYCol}, piso`)
      .eq(posIdCol, sourceFachadaId)
      .not(posXCol, "is", null)
      .not(posYCol, "is", null);

    if (!sourceUnits || sourceUnits.length === 0) {
      return NextResponse.json(
        { error: "No hay unidades posicionadas en la fachada origen" },
        { status: 400 }
      );
    }

    // 4. Get all unpositioned units on the target floor
    const targetQuery = auth.supabase
      .from("unidades")
      .select("id, identificador, piso")
      .eq("proyecto_id", sourceFachada.proyecto_id)
      .eq("piso", targetFachada.piso_numero);

    if (targetFachada.torre_id) {
      targetQuery.eq("torre_id", targetFachada.torre_id);
    }

    const { data: targetUnits } = await targetQuery;

    if (!targetUnits || targetUnits.length === 0) {
      return NextResponse.json(
        { error: "No hay unidades en el piso destino" },
        { status: 400 }
      );
    }

    // Filter to unpositioned units only
    const unpositionedTargets = targetUnits.filter(
      (u) => !sourceUnits.some((su) => su.id === u.id)
    );

    // 5. Pattern-match identifiers
    const sourcePiso = sourceFachada.piso_numero;
    const targetPiso = targetFachada.piso_numero;

    const matched: { source_id: string; target_id: string; source_identificador: string; target_identificador: string; x: number; y: number }[] = [];
    const unmatched: string[] = [];

    for (const sourceUnit of sourceUnits) {
      const expectedTargetId = remapIdentifier(
        sourceUnit.identificador,
        sourcePiso,
        targetPiso
      );

      const targetUnit = unpositionedTargets.find(
        (t) => t.identificador === expectedTargetId
      );

      if (targetUnit) {
        matched.push({
          source_id: sourceUnit.id,
          target_id: targetUnit.id,
          source_identificador: sourceUnit.identificador,
          target_identificador: targetUnit.identificador,
          x: (sourceUnit as Record<string, unknown>)[posXCol] as number,
          y: (sourceUnit as Record<string, unknown>)[posYCol] as number,
        });
      } else {
        unmatched.push(sourceUnit.identificador);
      }
    }

    // 6. Batch-update matched units
    if (matched.length > 0) {
      await Promise.all(
        matched.map((m) =>
          auth.supabase
            .from("unidades")
            .update({
              [posIdCol]: target_fachada_id,
              [posXCol]: m.x,
              [posYCol]: m.y,
            })
            .eq("id", m.target_id)
        )
      );
    }

    return NextResponse.json({
      matched: matched.map((m) => ({
        source_id: m.source_id,
        target_id: m.target_id,
        source_identificador: m.source_identificador,
        target_identificador: m.target_identificador,
      })),
      unmatched,
      matched_count: matched.length,
      unmatched_count: unmatched.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

/**
 * Remap a unit identifier from one floor to another.
 * Examples:
 *   "TP-201" sourcePiso=2 targetPiso=3 -> "TP-301"
 *   "TB-604" sourcePiso=6 targetPiso=7 -> "TB-704"
 *   "Apt 1204" sourcePiso=12 targetPiso=13 -> "Apt 1304"
 *   "A-101" sourcePiso=1 targetPiso=2 -> "A-201"
 */
function remapIdentifier(
  identifier: string,
  sourcePiso: number,
  targetPiso: number
): string {
  const sourceStr = sourcePiso.toString();
  const targetStr = targetPiso.toString();

  // Strategy 1: Find floor number after a non-digit separator followed by remaining digits
  // Matches patterns like: "TP-201", "A-101", "TB-604"
  const regex1 = new RegExp(`(\\D)${sourceStr}(\\d+)$`);
  if (regex1.test(identifier)) {
    return identifier.replace(regex1, `$1${targetStr}$2`);
  }

  // Strategy 2: Find floor number at the start followed by digits
  // Matches patterns like: "201", "604"
  const regex2 = new RegExp(`^${sourceStr}(\\d+)$`);
  if (regex2.test(identifier)) {
    return identifier.replace(regex2, `${targetStr}$1`);
  }

  // Strategy 3: Find floor number after space
  // Matches patterns like: "Apt 201", "Unit 604"
  const regex3 = new RegExp(`(\\s)${sourceStr}(\\d+)`);
  if (regex3.test(identifier)) {
    return identifier.replace(regex3, `$1${targetStr}$2`);
  }

  // No match -- return original (will be reported as unmatched)
  return identifier;
}
