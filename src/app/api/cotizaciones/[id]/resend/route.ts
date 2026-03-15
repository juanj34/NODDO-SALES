import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { createClient } from "@supabase/supabase-js";
import { sendCotizacionBuyer } from "@/lib/email";
import { formatCurrency } from "@/lib/currency";
import type { Currency } from "@/types";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { user } = auth;

    const { id } = await params;
    const supabase = getServiceClient();

    // Fetch cotización with project data
    const { data: cotizacion, error } = await supabase
      .from("cotizaciones")
      .select("*, proyectos(nombre, user_id)")
      .eq("id", id)
      .single();

    if (error || !cotizacion) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
    }

    // Verify user owns the project
    if (cotizacion.proyectos.user_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Download existing PDF
    if (!cotizacion.pdf_url) {
      return NextResponse.json({ error: "PDF no disponible" }, { status: 400 });
    }

    const pdfRes = await fetch(cotizacion.pdf_url);
    if (!pdfRes.ok) {
      return NextResponse.json({ error: "PDF no disponible" }, { status: 500 });
    }
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    // Format total
    const moneda = (cotizacion.config_snapshot?.moneda || "COP") as Currency;
    const totalFormatted = formatCurrency(cotizacion.resultado.precio_neto, moneda);

    // Resend email
    await sendCotizacionBuyer({
      buyerEmail: cotizacion.email,
      buyerName: cotizacion.nombre,
      projectName: cotizacion.proyectos.nombre,
      unidadId: cotizacion.unidad_snapshot.identificador,
      totalFormatted,
      pdfBuffer,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[resend cotizacion] Error:", err);
    return NextResponse.json({ error: "Error al reenviar email" }, { status: 500 });
  }
}
