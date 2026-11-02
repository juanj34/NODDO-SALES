# Plan: Instrumentar Error Reporting en Todas las API Routes

## Estado Actual

- **5 de 106 rutas** ya usan `reportApiError`
- **101 rutas** tienen catch blocks pero solo hacen `console.error` o nada
- El sistema ya funciona: Sentry + DB (`error_logs`) + Email + `/admin/errores`

## Cómo instrumentar una ruta

Siempre es el mismo cambio en 2 líneas:

```typescript
// 1. Agregar el import arriba del archivo
import { reportApiError } from "@/lib/error-reporter";

// 2. Agregar UNA línea en cada catch block, ANTES del return
} catch (err) {
  await reportApiError(err, { route: "/api/tu-ruta", statusCode: 500 }); // ← esta línea
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Error" },
    { status: 500 }
  );
}
```

Si la ruta tiene `auth` y/o `proyecto` disponibles, se puede agregar contexto:

```typescript
await reportApiError(err, {
  route: "/api/tu-ruta",
  statusCode: 500,
  user: auth ? { id: auth.user.id, email: auth.user.email, role: auth.role } : null,
  project: { id: proyectoId, name: proyectoNombre },
});
```

> **IMPORTANTE:** No cambiar NADA más en el archivo. Solo el import y la línea en el catch.

---

## Batch 1 — Leads y Tracking (ALTA PRIORIDAD)

Errores aquí = leads perdidos o analytics rotos.

| Ruta | Catch blocks |
|---|---|
| `api/leads/[id]/route.ts` | 1 |
| `api/leads/[id]/asignar/route.ts` | 1 |
| `api/leads/quick/route.ts` | 1 |
| `api/leads/[id]/cotizaciones/route.ts` | 1 |
| `api/track/route.ts` | 1 |
| `api/track/dashboard/route.ts` | 1 |

---

## Batch 2 — Editor: Tipologías, Galería, Videos, Recursos, POIs (ALTA PRIORIDAD)

Errores aquí bloquean la edición de proyectos.

| Ruta | Catch blocks |
|---|---|
| `api/tipologias/route.ts` | 1 |
| `api/tipologias/[id]/route.ts` | 2 |
| `api/tipologias/[id]/clonar/route.ts` | 1 |
| `api/tipologias/reorder/route.ts` | 1 |
| `api/galeria/categorias/route.ts` | 1 |
| `api/galeria/categorias/[id]/route.ts` | 2 |
| `api/galeria/categorias/reorder/route.ts` | 1 |
| `api/galeria/imagenes/route.ts` | 1 |
| `api/galeria/imagenes/[id]/route.ts` | 2 |
| `api/galeria/imagenes/batch/route.ts` | 1 |
| `api/galeria/imagenes/reorder/route.ts` | 1 |
| `api/videos/route.ts` | 1 |
| `api/videos/[id]/route.ts` | 2 |
| `api/videos/reorder/route.ts` | 1 |
| `api/videos/stream/upload/route.ts` | 1 |
| `api/videos/stream/status/[uid]/route.ts` | 1 |
| `api/recursos/route.ts` | 1 |
| `api/recursos/[id]/route.ts` | 2 |
| `api/puntos-interes/route.ts` | 1 |
| `api/puntos-interes/[id]/route.ts` | 2 |

---

## Batch 3 — Inventario y Unidades (ALTA PRIORIDAD)

Errores aquí afectan disponibilidad y ventas.

| Ruta | Catch blocks |
|---|---|
| `api/unidades/route.ts` | 2 |
| `api/unidades/[id]/route.ts` | 2 |
| `api/unidades/bulk/route.ts` | 2 |
| `api/unidades/bulk-update/route.ts` | 1 |
| `api/unidades/[id]/sale-context/route.ts` | 1 |
| `api/unidad-tipologias/route.ts` | 2 |
| `api/torres/route.ts` | 2 |
| `api/torres/[id]/route.ts` | 2 |
| `api/vistas-piso/route.ts` | 2 |
| `api/vistas-piso/[id]/route.ts` | 2 |

---

## Batch 4 — Cotizaciones (MEDIA PRIORIDAD)

| Ruta | Catch blocks |
|---|---|
| `api/cotizaciones/route.ts` | 7 |
| `api/cotizaciones/preview/route.ts` | 1 |
| `api/cotizaciones/[id]/regenerate/route.ts` | 1 |
| `api/cotizaciones/[id]/resend/route.ts` | 1 |

---

## Batch 5 — Proyecto Avanzado: Publicar, Clonar, Webhooks, Tours (MEDIA PRIORIDAD)

| Ruta | Catch blocks |
|---|---|
| `api/proyectos/[id]/publicar/route.ts` | 1 |
| `api/proyectos/[id]/despublicar/route.ts` | 1 |
| `api/proyectos/[id]/clonar/route.ts` | 1 |
| `api/proyectos/[id]/analytics/route.ts` | 1 |
| `api/proyectos/[id]/storage/route.ts` | 1 |
| `api/proyectos/[id]/webhooks/route.ts` | 3 |
| `api/proyectos/[id]/webhooks/test/route.ts` | 1 |
| `api/proyectos/[id]/webhooks/logs/route.ts` | 1 |
| `api/proyectos/[id]/versiones/route.ts` | 1 |
| `api/proyectos/[id]/versiones/[versionId]/restaurar/route.ts` | 1 |
| `api/proyectos/[id]/disponibilidad-context/route.ts` | 1 |
| `api/proyectos/[id]/publicar-disponibilidad/route.ts` | 1 |
| `api/tours/[proyecto_id]/route.ts` | 1 |
| `api/tours/presign/route.ts` | 1 |
| `api/tours/upload-file/route.ts` | 1 |

---

## Batch 6 — Fachadas, Planos, Avances, Complementos (MEDIA PRIORIDAD)

| Ruta | Catch blocks |
|---|---|
| `api/fachadas/route.ts` | 1 |
| `api/fachadas/[id]/route.ts` | 2 |
| `api/fachadas/[id]/duplicar-hotspots/route.ts` | 1 |
| `api/planos/route.ts` | 2 |
| `api/planos/[id]/route.ts` | 2 |
| `api/plano-puntos/route.ts` | 2 |
| `api/plano-puntos/[id]/route.ts` | 2 |
| `api/avances-obra/route.ts` | 1 |
| `api/avances-obra/[id]/route.ts` | 2 |
| `api/avances-obra/reorder/route.ts` | 1 |
| `api/complementos/route.ts` | 2 |
| `api/complementos/[id]/route.ts` | 2 |
| `api/complementos/assign/route.ts` | 1 |
| `api/complementos/bulk/route.ts` | 1 |

---

## Batch 7 — Colaboradores (BAJA PRIORIDAD)

| Ruta | Catch blocks |
|---|---|
| `api/colaboradores/route.ts` | 3 |
| `api/colaboradores/[id]/route.ts` | 3 |
| `api/colaboradores/[id]/proyectos/route.ts` | 2 |
| `api/colaboradores/[id]/resend/route.ts` | 1 |
| `api/colaboradores/[id]/reset-password/route.ts` | 1 |

---

## Batch 8 — Dashboard, Analytics, Dominios (BAJA PRIORIDAD)

| Ruta | Catch blocks |
|---|---|
| `api/dashboard/summary/route.ts` | 1 |
| `api/analytics/financiero/route.ts` | 1 |
| `api/analytics/dashboard/route.ts` | 1 |
| `api/analytics/ai-usage/route.ts` | 1 |
| `api/domains/route.ts` | 1 |
| `api/domains/verify/route.ts` | 1 |
| `api/plan-limit/route.ts` | 1 |
| `api/auth/me/route.ts` | 1 |
| `api/bitacora/route.ts` | 1 |
| `api/bitacora/export/route.ts` | 1 |
| `api/marketing/appointments/route.ts` | 1 |
| `api/marketing/capi/route.ts` | 1 |
| `api/exchange-rates/route.ts` | 1 |
| `api/exchange-rates/cron/route.ts` | 1 |

---

## Batch 9 — AI (BAJA PRIORIDAD)

| Ruta | Catch blocks |
|---|---|
| `api/ai/create-project/route.ts` | 1 |
| `api/ai/improve-text/route.ts` | 2 |
| `api/ai/parse-units/route.ts` | 1 |
| `api/ai/modify-units/route.ts` | 1 |
| `api/ai/analyze-csv/route.ts` | 1 |
| `api/ai/discover-pois/route.ts` | 1 |
| `api/ai/discover-pois-chat/route.ts` | 1 |

---

## Batch 10 — Admin y Cron (BAJA PRIORIDAD)

| Ruta | Catch blocks |
|---|---|
| `api/admin/health/route.ts` | 1 |
| `api/admin/emails/route.ts` | 1 |
| `api/admin/usuarios/invite/route.ts` | 1 |
| `api/cron/daily-digest/route.ts` | 2 |
| `api/cron/weekly-digest/route.ts` | 2 |
| `api/cron/weekly-resource-report/route.ts` | 5 |

---

## Resumen

| Prioridad | Batches | Rutas | Catch blocks |
|---|---|---|---|
| ALTA | 1-3 | 36 | 52 |
| MEDIA | 4-6 | 33 | 47 |
| BAJA | 7-10 | 32 | 41 |
| **Total** | **10** | **101** | **~140** |
