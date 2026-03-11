import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/ai";

const SYSTEM_PROMPT = `Eres un asistente experto en proyectos inmobiliarios en Latinoamérica. Tu trabajo es extraer información estructurada de textos, brochures y descripciones de proyectos inmobiliarios para crear un micrositio.

Debes responder SIEMPRE en JSON válido con esta estructura exacta:
{
  "extractedData": {
    "nombre": "string o null",
    "descripcion": "string o null",
    "constructora_nombre": "string o null",
    "ubicacion_direccion": "string o null",
    "ubicacion_lat": "number o null",
    "ubicacion_lng": "number o null",
    "color_primario": "string hex o null",
    "color_secundario": "string hex o null",
    "color_fondo": "string hex o null",
    "whatsapp_numero": "string o null",
    "disclaimer": "string o null",
    "tipologias": [
      {
        "nombre": "string",
        "descripcion": "string o null",
        "area_m2": "number o null",
        "habitaciones": "number o null",
        "banos": "number o null",
        "precio_desde": "number o null",
        "caracteristicas": ["string"],
        "parqueaderos": "number o null",
        "area_balcon": "number o null"
      }
    ]
  },
  "followUpQuestions": ["preguntas sobre información que falta o que necesitas aclarar"],
  "summary": "resumen breve de lo que extrajiste"
}

Reglas:
- Extrae todo lo que puedas del texto proporcionado
- Si no puedes determinar un campo, usa null
- Los precios deben estar en pesos colombianos (COP) sin separadores de miles
- Las coordenadas deben ser decimales (ej: 4.6097, -74.0817)
- Los colores deben ser hex (ej: #D4A574)
- Si el usuario menciona una ciudad o dirección, intenta inferir las coordenadas aproximadas
- Haz preguntas de seguimiento sobre información importante que falte (nombre, ubicación, tipologías)
- El resumen debe ser corto (1-2 oraciones)
- SIEMPRE responde en JSON válido, sin texto adicional antes o después`;

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { messages, fileUrls } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un mensaje" },
        { status: 400 }
      );
    }

    // Build context from all messages
    let userContext = "";
    for (const msg of messages) {
      if (msg.role === "user") {
        userContext += `\nUsuario: ${msg.content}`;
      } else if (msg.role === "assistant") {
        userContext += `\nAsistente (respuesta anterior): ${msg.content}`;
      }
    }

    // Add file URLs as context
    if (fileUrls && fileUrls.length > 0) {
      userContext += `\n\nArchivos subidos (URLs): ${fileUrls.join(", ")}`;
    }

    const response = await callClaude(SYSTEM_PROMPT, userContext.trim());

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "No se pudo procesar la respuesta del AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error en AI Creator" },
      { status: 500 }
    );
  }
}
