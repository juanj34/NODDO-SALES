import { getAuthContext } from "@/lib/auth-context";
import { callClaude } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { lat, lng, projectName, address } = await request.json();
    if (lat == null || lng == null) {
      return NextResponse.json(
        { error: "lat y lng son requeridos" },
        { status: 400 }
      );
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    let placesContext = "";

    if (mapboxToken) {
      const categories = [
        "hospital", "school", "restaurant", "shopping",
        "park", "gym", "bank", "supermarket",
      ];

      const placesResults = await Promise.all(
        categories.map(async (cat) => {
          try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${cat}.json?proximity=${lng},${lat}&limit=3&access_token=${mapboxToken}&language=es`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.features || []).map(
              (f: { place_name: string; center: number[] }) => ({
                name: f.place_name,
                lng: f.center[0],
                lat: f.center[1],
                searchCategory: cat,
              })
            );
          } catch {
            return [];
          }
        })
      );

      const allPlaces = placesResults.flat();
      if (allPlaces.length > 0) {
        placesContext = `\n\nResultados de Mapbox Geocoding cercanos:\n${JSON.stringify(allPlaces, null, 2)}`;
      }
    }

    const systemPrompt = `Eres un asistente que genera puntos de interes (POIs) para proyectos inmobiliarios en America Latina.
Debes devolver SOLO un JSON array valido, sin markdown ni explicaciones.

Categorias permitidas: "Comercio", "Recreacion", "Salud", "Educacion", "Transporte", "Gastronomia", "Cultura", "Deporte"

Cada objeto debe tener:
- nombre: string (nombre del lugar)
- descripcion: string | null (breve descripcion)
- categoria: string (una de las categorias permitidas)
- lat: number
- lng: number
- imagen_url: null
- ciudad: string | null
- distancia_km: number | null (distancia aproximada desde el proyecto)
- tiempo_minutos: number | null (tiempo de viaje estimado en minutos)
- orden: number (empezando desde 0)

Genera entre 15-25 POIs variados, distribuyendo equitativamente entre las categorias.
Si se proporcionan resultados de Mapbox, usalos como base y enriquecelos con descripciones y categorias apropiadas.
Si no, genera POIs plausibles basados en la ubicacion.

Responde SOLO con el JSON array.`;

    const userMessage = `Proyecto: ${projectName || "Sin nombre"}
Ubicacion: lat ${lat}, lng ${lng}
${address ? `Direccion: ${address}` : ""}${placesContext}`;

    const result = await callClaude(systemPrompt, userMessage);

    const cleaned = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ pois: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al descubrir POIs" },
      { status: 500 }
    );
  }
}
