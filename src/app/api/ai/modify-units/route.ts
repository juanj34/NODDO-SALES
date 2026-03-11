import { getAuthContext } from "@/lib/auth-context";
import { callClaude } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

interface UnitSummary {
  id: string;
  identificador: string;
  tipologia_id: string | null;
  fachada_id: string | null;
  piso: number | null;
  area_m2: number | null;
  precio: number | null;
  estado: string;
  habitaciones: number | null;
  banos: number | null;
}

interface TipologiaSummary {
  id: string;
  nombre: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { message, unidades, tipologias, fachadas } = await request.json();
    if (!message) {
      return NextResponse.json(
        { error: "message es requerido" },
        { status: 400 }
      );
    }

    const tipologiasList = (tipologias || [])
      .map((t: TipologiaSummary) => `- ${t.nombre} (ID: ${t.id})`)
      .join("\n");

    const fachadasList = (fachadas || [])
      .map((f: TipologiaSummary) => `- ${f.nombre} (ID: ${f.id})`)
      .join("\n");

    const unidadesJSON = JSON.stringify(
      (unidades || []).map((u: UnitSummary) => ({
        id: u.id,
        identificador: u.identificador,
        tipologia_id: u.tipologia_id,
        fachada_id: u.fachada_id,
        piso: u.piso,
        area_m2: u.area_m2,
        precio: u.precio,
        estado: u.estado,
        habitaciones: u.habitaciones,
        banos: u.banos,
      }))
    );

    const systemPrompt = `Eres un asistente que modifica datos de unidades inmobiliarias según instrucciones en lenguaje natural.

El usuario te dará instrucciones en español para modificar unidades existentes. Debes responder SOLO con un JSON válido con esta estructura:
{
  "summary": "Descripción breve de los cambios en español",
  "changes": [
    {
      "id": "uuid-de-la-unidad",
      "identificador": "Apto 101",
      "updates": { "campo": "nuevo_valor" }
    }
  ]
}

Campos que puedes modificar:
- precio: number (ej: subir 5% = multiplicar por 1.05)
- estado: "disponible" | "separado" | "reservada" | "vendida"
- tipologia_id: string (ID de tipología) o null
- fachada_id: string (ID de fachada) o null
- piso: number | null
- area_m2: number | null
- habitaciones: number | null
- banos: number | null
- orientacion: string | null
- vista: string | null
- notas: string | null

${tipologiasList ? `Tipologías disponibles:\n${tipologiasList}` : ""}
${fachadasList ? `Fachadas disponibles:\n${fachadasList}` : ""}

Unidades actuales:
${unidadesJSON}

Reglas:
- Si el usuario dice "sube precios X%" aplica SOLO a unidades con estado "disponible" y precio != null, a menos que diga otra cosa.
- Si dice "marca como vendida" cambia el estado.
- Calcula los precios exactos, no uses fórmulas.
- Responde SOLO con el JSON. Sin markdown ni explicaciones.`;

    const result = await callClaude(systemPrompt, message);
    const cleaned = result
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error al procesar modificaciones",
      },
      { status: 500 }
    );
  }
}
