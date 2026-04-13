import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";
import { addDomainToVercel, removeDomainFromVercel } from "@/lib/vercel";
import { revalidateProyecto } from "@/lib/supabase/cached-queries";

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "config.write");
    if (denied) return denied;

    const body = await request.json();
    const { proyecto_id, subdomain, custom_domain } = body;

    if (!proyecto_id) {
      return NextResponse.json(
        { error: "proyecto_id es requerido" },
        { status: 400 }
      );
    }

    // Verify ownership and get current domain/slug/subdomain
    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("id, slug, subdomain, custom_domain")
      .eq("id", proyecto_id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (!proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, string | boolean | null> = {};

    if (subdomain !== undefined) {
      // Validate subdomain format
      const cleanSubdomain = subdomain
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/(^-|-$)/g, "");

      if (!cleanSubdomain) {
        return NextResponse.json(
          { error: "Subdominio invalido" },
          { status: 400 }
        );
      }

      // Check uniqueness against both subdomain and slug columns
      // (getProyectoBySlug uses .or(slug, subdomain) so a collision on either would be ambiguous)
      const [{ data: subdomainConflict }, { data: slugConflict }] = await Promise.all([
        auth.supabase
          .from("proyectos")
          .select("id")
          .eq("subdomain", cleanSubdomain)
          .neq("id", proyecto_id)
          .maybeSingle(),
        auth.supabase
          .from("proyectos")
          .select("id")
          .eq("slug", cleanSubdomain)
          .neq("id", proyecto_id)
          .maybeSingle(),
      ]);

      if (subdomainConflict || slugConflict) {
        return NextResponse.json(
          { error: "Este subdominio ya esta en uso" },
          { status: 409 }
        );
      }

      updates.subdomain = cleanSubdomain;
      // Sync slug to match subdomain (keeps them coherent)
      updates.slug = cleanSubdomain;
    }

    if (custom_domain !== undefined) {
      if (custom_domain === null || custom_domain === "") {
        updates.custom_domain = null;
        updates.domain_verified = false;
      } else {
        // Validate domain format
        const domainRegex =
          /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
        if (!domainRegex.test(custom_domain)) {
          return NextResponse.json(
            { error: "Formato de dominio invalido" },
            { status: 400 }
          );
        }

        // Check uniqueness
        const { data: existing } = await auth.supabase
          .from("proyectos")
          .select("id")
          .eq("custom_domain", custom_domain)
          .neq("id", proyecto_id)
          .single();

        if (existing) {
          return NextResponse.json(
            { error: "Este dominio ya esta en uso" },
            { status: 409 }
          );
        }

        updates.custom_domain = custom_domain;
        updates.domain_verified = false;
      }
    }

    const { data, error } = await auth.supabase
      .from("proyectos")
      .update(updates)
      .eq("id", proyecto_id)
      .select()
      .single();

    if (error) throw error;

    // Revalidate cached microsite data so changes take effect immediately
    const oldSlug = proyecto.slug as string;
    const oldSubdomain = proyecto.subdomain as string | null;
    await revalidateProyecto(oldSlug);
    if (updates.subdomain && updates.subdomain !== oldSlug) {
      await revalidateProyecto(updates.subdomain as string);
    }
    if (oldSubdomain && oldSubdomain !== oldSlug && oldSubdomain !== updates.subdomain) {
      await revalidateProyecto(oldSubdomain);
    }

    // Register/remove custom domain with Vercel (best-effort, don't block on failure)
    if (process.env.AUTH_BEARER_TOKEN && process.env.VERCEL_PROJECT_ID) {
      try {
        const oldDomain = proyecto.custom_domain as string | null;
        const newDomain = (updates.custom_domain as string | null) ?? undefined;

        // Remove old domain from Vercel if it changed
        if (oldDomain && newDomain !== undefined && oldDomain !== newDomain) {
          await removeDomainFromVercel(oldDomain);
        }

        // Add new domain to Vercel
        if (newDomain) {
          await addDomainToVercel(newDomain);
        }
      } catch {
        // Vercel API errors are non-blocking — domain will still be saved in DB
      }
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
