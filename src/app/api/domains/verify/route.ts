import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";
import { getDomainConfig } from "@/lib/vercel";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { proyecto_id } = await request.json();

    if (!proyecto_id) {
      return NextResponse.json(
        { error: "proyecto_id es requerido" },
        { status: 400 }
      );
    }

    // Get project with custom domain
    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("id, custom_domain")
      .eq("id", proyecto_id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (!proyecto || !proyecto.custom_domain) {
      return NextResponse.json(
        { error: "No hay dominio custom configurado" },
        { status: 400 }
      );
    }

    // If Vercel API is configured, check domain verification
    if (process.env.AUTH_BEARER_TOKEN && process.env.VERCEL_PROJECT_ID) {
      try {
        const config = await getDomainConfig(proyecto.custom_domain);

        if (config.misconfigured === false) {
          // Domain is properly configured
          await auth.supabase
            .from("proyectos")
            .update({ domain_verified: true })
            .eq("id", proyecto_id);

          return NextResponse.json({
            verified: true,
            message: "Dominio verificado correctamente",
          });
        }

        return NextResponse.json({
          verified: false,
          message: "DNS aun no propagado. Intenta de nuevo en unos minutos.",
          config,
        });
      } catch {
        return NextResponse.json({
          verified: false,
          message:
            "No se pudo verificar. Asegurate de configurar los registros DNS.",
        });
      }
    }

    // No Vercel API configured — manual verification
    return NextResponse.json({
      verified: false,
      message:
        "Verificacion automatica no disponible. Configura las variables de Vercel API.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
