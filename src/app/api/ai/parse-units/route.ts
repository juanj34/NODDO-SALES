import { getAuthContext } from "@/lib/auth-context";
import { callClaude } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { rawText, tipologias } = await request.json();
    if (!rawText) {
      return NextResponse.json(
        { error: "rawText es requerido" },
        { status: 400 }
      );
    }

    const tipologiasList = (tipologias || [])
      .map((t: { id: string; nombre: string }) => `- ${t.nombre} (ID: ${t.id})`)
      .join("\n");

    const systemPrompt = `Eres un asistente que extrae datos de unidades inmobiliarias (apartamentos/casas) de texto sin estructura.
Debes devolver SOLO un JSON array valido, sin markdown ni explicaciones.

Cada objeto debe tener estos campos (usa null si no hay dato):
- identificador: string (ej: "Apt 101", "T1-301")
- piso: number | null
- area_m2: number | null
- precio: number | null
- estado: "disponible" | "separado" | "reservada" | "vendida" (default: "disponible")
- habitaciones: number | null
- banos: number | null
- orientacion: string | null (ej: "Norte", "Sur", "Oriente")
- vista: string | null (ej: "Ciudad", "Montana", "Interior")
- notas: string | null
- tipologia_id: string | null

${tipologiasList ? `Tipologias disponibles para asignar tipologia_id:\n${tipologiasList}` : "No hay tipologias definidas aun."}

Responde SOLO con el JSON array. Sin explicaciones ni markdown.`;

    const result = await callClaude(systemPrompt, rawText);

    const cleaned = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ unidades: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al parsear unidades" },
      { status: 500 }
    );
  }
}
