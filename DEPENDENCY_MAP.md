# 🗺️ MAPA COMPLETO DE DEPENDENCIAS - NODDO

**Última actualización:** 2026-04-09  
**Propósito:** Entender el impacto transversal de cambios en el sistema

---

## 📋 ÍNDICE

1. [Cambios de Esquema & Impacto](#cambios-de-esquema--impacto)
2. [Dependencias de Tablas Supabase](#dependencias-de-tablas-supabase)
3. [Dependencias de API Routes](#dependencias-de-api-routes)
4. [Dependencias de Componentes](#dependencias-de-componentes)
5. [Flujos Transversales Críticos](#flujos-transversales-críticos)
6. [Matriz de Impacto](#matriz-de-impacto)
7. [Guía de Cambios Seguros](#guía-de-cambios-seguros)

---

## 🔴 CAMBIOS DE ESQUEMA & IMPACTO

### AGREGAR CAMPO A `proyectos`

**Ejemplo:** Agregar campo `nueva_feature_enabled: boolean`

**Afecta:**
1. **API Routes** (12 endpoints):
   - `GET /api/proyectos` - Incluye campo
   - `POST /api/proyectos` - Validación/default
   - `PUT /api/proyectos/[id]` - Update
   - `GET /api/proyectos/[id]` - Incluye campo
   - `GET /api/admin/proyectos` - Admin ve cambio
   - `GET /api/admin/proyectos/[id]` - Admin detalle
   - `PUT /api/admin/proyectos/[id]` - Admin update
   - `/api/ai/create-project` - Puede inferirlo
   - `/api/proyectos/[id]/storage` - Info storage
   - `/api/analytics/dashboard` - Si es analítica
   - `GET /api/plan-limit` - Si es limit-based
   - `/api/proyectos/[id]/disponibilidad-context` - Si requiere feature

2. **Supabase Queries**:
   - `src/lib/supabase/queries.ts` - SELECT statement
   - `src/lib/supabase/server-queries.ts` - Server select
   - `src/lib/supabase/cached-queries.ts` - Caché queries

3. **Hooks**:
   - `useEditorProject()` - Acceso en editor
   - `useProject()` - Acceso genérico
   - `useProjectsQuery()` - Lista proyectos

4. **Componentes Dashboard** (múltiples):
   - `GeneralTab.tsx` - Si es visible en config
   - `/editor/[id]/config` - Si es configuración
   - `ProjectsTable.tsx` - Si es mostrable en tabla
   - Posiblemente 5-10 más si es feature flag

5. **Componentes Micrositio** (si visible):
   - `SiteLayoutClient.tsx` - Si necesita conocer estado
   - Componentes condicionados: `/sites/[slug]/[seccion]`

6. **Tipos TypeScript**:
   - `src/types/index.ts` - Interface Proyecto
   - 15+ archivos que importan Proyecto

7. **Migraciones**:
   - Nueva migración SQL `ALTER TABLE proyectos ADD COLUMN...`
   - Versionamiento de BD actualizado

8. **Email Templates** (si aplica):
   - `src/lib/email.ts` - Si incluye en emails
   - `src/lib/email-i18n.ts` - Multiidioma

**Checklist de cambio:**
```
- [ ] Crear migración SQL en supabase/migrations/
- [ ] Actualizar interface Proyecto en src/types/
- [ ] Actualizar queries en src/lib/supabase/queries.ts
- [ ] Crear/actualizar Zod schema en API route
- [ ] Actualizar todos los GET /api/proyectos*
- [ ] Actualizar PUT /api/proyectos/[id]
- [ ] Si visible: actualizar componentes (GeneralTab, etc)
- [ ] Actualizar hooks (useEditorProject, useProjectsQuery)
- [ ] Si RLS: actualizar policies en Supabase
- [ ] Tests: verificar que queries devuelven campo
- [ ] Migrations: npx supabase db push
```

---

### AGREGAR CAMPO A `unidades`

**Ejemplo:** `nueva_caracteristica: string`

**Afecta:**
1. **API Routes** (8 endpoints):
   - `GET /api/unidades` - Debe incluir
   - `POST /api/unidades` - Create
   - `PUT /api/unidades/[id]` - Update
   - `DELETE /api/unidades/[id]` - Delete
   - `POST /api/unidades/bulk` - Bulk create
   - `POST /api/unidades/bulk-update` - Bulk update
   - `GET /api/unidades/[id]/sale-context` - Si relevante para venta
   - `/api/unidad-tipologias` - Si afecta relación

2. **Supabase**:
   - `unidades` table - ALTER
   - `unidad_tipologias` table - Si es vinculación
   - RLS policies - Permiso read/write

3. **Micrositio** (afecta display):
   - `/sites/[slug]/inventario` - Mostrar en listado
   - `/sites/[slug]/galeria` - Si filtro/categoría
   - Cotizador - Si incluir en cálculo precio
   - `/sites/[slug]/implantaciones` - Si visible

4. **Dashboard Editor**:
   - `/editor/[id]/inventario` - Editar unidades
   - `InventarioTab.tsx` - Config columnas
   - `SmartImportModal.tsx` - Importar CSV
   - Cualquier modal de unidad

5. **Cotizador**:
   - `src/lib/cotizador/calcular.ts` - Si afecta precio
   - PDF renderer - Si incluir en cotización
   - `CotizadorTab.tsx` - Config si es configurable

6. **Tipos**:
   - `Unidad` interface en `src/types/index.ts`
   - 20+ archivos que usan este tipo

**Cuándo procede:**
- Si es **display**: bajo riesgo, solo micrositio
- Si es **cálculo de precio**: ALTO riesgo, afecta cotizaciones
- Si es **filtro/inventario**: MEDIO riesgo, afecta búsqueda

---

### CAMBIO EN TABLA `cotizaciones`

**Ejemplo:** Cambiar estructura de `complementos_json` de array a objeto

**Afecta:**
1. **API Routes**:
   - `POST /api/cotizaciones` - Crear con nueva estructura
   - `GET /api/cotizaciones` - Buscar/filtrar
   - `PUT /api/cotizaciones/[id]` - Update
   - `POST /api/cotizaciones/[id]/regenerate` - Recalcular
   - `/api/admin/cotizaciones/*` - Admin acceso

2. **Cotizador Library**:
   - `src/lib/cotizador/calcular.ts` - Lógica de cálculo
   - `src/lib/cotizador/pdf-react/document.tsx` - Render PDF
   - Validación Zod en API

3. **Micrositio**:
   - Modal cotizador en `/sites/[slug]/*`
   - Lógica selección complementos
   - Visualización de presupuesto

4. **Dashboard**:
   - `/editor/[id]/cotizador` - Config complementos
   - `/editor/[id]/cotizador-settings` - Ajustes
   - `/dashboard/cotizaciones` - Listado/filtro
   - `/dashboard/cotizador` - Generador

5. **Email**:
   - `src/lib/email.ts` - sendCotizacionBuyer()
   - `src/lib/email-i18n.ts` - Traducción
   - Template PDF incrustado

6. **Tipos**:
   - `CotizadorConfig` interface
   - `Cotizacion` interface
   - Zod schemas

⚠️ **RIESGO ALTO**: Afecta múltiples flujos críticos. Requiere:
- Migración con conversion de datos existentes
- Tests de backward compatibility
- Validación exhaustiva de PDFs generados
- Email templates actualizado

---

## 📊 DEPENDENCIAS DE TABLAS SUPABASE

### TABLA: `proyectos`

**Lectores:**
```
DIRECTO:
  - useEditorProject() hook
  - useProjectsQuery() hook
  - GET /api/proyectos*
  - SiteProjectContext (micrositio)

INDIRECTO (vía referencia):
  - tipologias.proyecto_id → proyectos.id
  - unidades.proyecto_id → proyectos.id
  - galeria_categorias.proyecto_id → proyectos.id
  - videos.proyecto_id → proyectos.id
  - puntos_interes.proyecto_id → proyectos.id
  - cotizaciones.proyecto_id → proyectos.id
  - leads.proyecto_id → proyectos.id
  - + 10 más...
```

**Escritores:**
```
  - POST /api/proyectos (crear)
  - PUT /api/proyectos/[id] (actualizar)
  - DELETE /api/proyectos/[id] (eliminar)
  - POST /api/ai/create-project (IA crea)
  - PUT /api/proyectos/[id]/publicar (estado)
  - PUT /api/proyectos/[id]/despublicar (estado)
  - POST /api/proyectos/[id]/clonar (copia)
  - Dashboard: GeneralTab, MicrositeTab, etc.
```

**Impacto si cambias:**
- ✅ Agregar campo: low (ver sección anterior)
- ❌ Eliminar campo: HIGH (cascada)
- ⚠️ Cambiar tipo: MEDIUM (validación)
- ❌ Eliminar registro: HIGH (orfandad de datos)

---

### TABLA: `tipologias`

**Lectores:**
```
DIRECTO:
  - /editor/[id]/tipologias page
  - /api/tipologias GET
  - Micrositio /sites/[slug]/tipologias
  - Cotizador (seleccionar tipología)

INDIRECTO:
  - unidades → tipologia_id FK
  - tipologia_precio_historial → tipologia_id
  - componentes → tipologia_id (si multiselect)
  - Renders/planos/videos → tied to tipologia
```

**Escritores:**
```
  - POST /api/tipologias
  - PUT /api/tipologias/[id]
  - DELETE /api/tipologias/[id]
  - POST /api/tipologias/[id]/clonar
  - Dashboard: TipologiasTab
```

**Impacto crítico:**
- Cambiar `precio_desde` → afecta Cotizador + Analytics + Micrositio
- Eliminar tipología → orfandad de unidades (FK constraint)
- Cambiar `area_m2` → afecta Cotizador + Búsqueda

---

### TABLA: `unidades`

**Lectores:**
```
DIRECTO:
  - GET /api/unidades (20K+ unidades posibles)
  - /editor/[id]/inventario
  - /sites/[slug]/inventario (públicas)
  - /sites/[slug]/cotizador (seleccionar unidad)

INDIRECTO:
  - unidad_tipologias M2M → unidades.id
  - cotizaciones → unidad_id (historial)
  - disponibilidad_reserva → unidad_id
  - unidad_state_history → unidad_id
```

**Escritores:**
```
  - POST /api/unidades
  - PUT /api/unidades/[id]
  - DELETE /api/unidades/[id]
  - POST /api/unidades/bulk
  - POST /api/unidades/bulk-update
  - Dashboard: InventarioTab, CSV import
  - IA: /api/ai/parse-units, /api/ai/modify-units
```

**Impacto crítico:**
- **Cambiar `estado`** → Afecta:
  - Visibilidad en micrositio (ocultar_vendidas)
  - Disponibilidad para cotizador
  - Analytics (sold count)
  - Leads (puede/no puede cotizar)
  
- **Cambiar `precio`** → Afecta:
  - Cotizador (cálculo)
  - Micrositio (display)
  - Analytics (revenue)
  - Historial de precios
  
- **Agregar `area_m2`** → Afecta:
  - Búsqueda/filtro (si habilitado)
  - Comparador (si existe)
  - PDF cotización

---

### TABLA: `cotizaciones`

**Lectores:**
```
  - GET /api/cotizaciones (historial lead)
  - /dashboard/cotizaciones (dashboard)
  - /sites/[slug]/contact (si muestra historial)
  - Analytics (cotizaciones generadas)
  - Webhooks (evento cotizacion.creada)
```

**Escritores:**
```
  - POST /api/cotizaciones (crear)
  - PUT /api/cotizaciones/[id] (actualizar email enviado)
  - POST /api/cotizaciones/[id]/regenerate (PDF)
  - POST /api/cotizaciones/[id]/resend (email)
```

**Impacto crítico:**
- **Cambiar estructura `complementos_json`** → Recalcular TODOS los PDFs
- **Cambiar `estado_pago`** → Afecta webhooks y analytics
- **Agregar `comision_vendedor`** → Afecta financiero

**Flujo completo:**
```
unidades.precio → calcularCotizacion() → complementos + descuentos
                   → validar en servidor
                   → guardar en BD
                   → generatePDF()
                   → email
                   → webhook
```

---

### TABLA: `leads`

**Lectores:**
```
  - /dashboard/leads (CRM)
  - /editor/[id]/estadisticas
  - /sites/[slug]/contacto (después de submit)
  - Analytics (leads count)
  - Admin: /api/admin/leads
```

**Escritores:**
```
  - POST /api/leads (público, formulario)
  - PUT /api/leads/[id] (actualizar estado/asignación)
  - POST /api/leads/[id]/asignar (asignar a usuario)
  - POST /api/leads/quick (API rápida)
  - Dashboard: LeadsCRMTable
```

**Relaciones:**
- leads → cotizaciones (1:many)
- leads → user_id (asignación)
- leads → proyecto_id

**Impacto:**
- Cambiar `status` enum → Afecta CRM flujo
- Agregar `custom_field` → Requiere migración + UI update
- Cambiar `email` a requerido → Afecta leads públicos

---

### TABLA: `galeria_imagenes`

**Lectores:**
```
  - /sites/[slug]/galeria (público, render)
  - /editor/[id]/galeria (editar)
  - /dashboard/analytics (views por categoría)
  - Lightbox component
```

**Escritores:**
```
  - POST /api/galeria/imagenes (upload)
  - PUT /api/galeria/imagenes/[id] (editar info)
  - DELETE /api/galeria/imagenes/[id]
  - POST /api/galeria/imagenes/batch
  - PUT /api/galeria/imagenes/reorder
```

**Storage:**
- URLs en Supabase Storage: `media/{user_id}/{proyecto_id}/galeria/`

**Impacto:**
- Cambiar `url` → Links rotos en micrositio + emails
- Eliminar imagen → Lightbox se rompe si es en galería de página
- Cambiar `categoria_id` → Reorganización visual

---

### TABLA: `videos`

**Lectores:**
```
  - /sites/[slug]/videos (YouTube embeds)
  - /editor/[id]/videos (editar lista)
  - Tipologías (video_id referencia)
```

**Escritores:**
```
  - POST /api/videos
  - PUT /api/videos/[id]
  - DELETE /api/videos/[id]
  - POST /api/videos/reorder
```

**Impacto:**
- Cambiar URL youtube → Video muerto en micrositio
- Agregar campo (ej: duration) → UI update

---

## 🔌 DEPENDENCIAS DE API ROUTES

### API: `GET /api/proyectos`

**Entrada:**
```json
{
  "search?": "string",
  "status?": "publicado|borrador|archivado",
  "sortBy?": "updated_at|nombre|created_at",
  "limit?": "50",
  "offset?": "0"
}
```

**Consumidores:**
1. **Frontend:**
   - `/dashboard` (home) → recent projects
   - `/proyectos` (projects table)
   - Hook: `useProjectsQuery()`
   - Analytics: project selection

2. **Externos:**
   - Webhooks (si disparan evento)
   - Analytics service (si sync)

**Dependencias de tabla:**
- `proyectos` table
- `users` (propietario)
- `colaborador_proyectos` (verificar acceso)

**Si cambia:** Rompe lista proyectos, búsqueda, filtros

---

### API: `POST /api/cotizaciones`

**Entrada:**
```json
{
  "proyecto_id": "uuid",
  "unidad_id": "uuid",
  "complementos": [...],
  "fase": "numero|porcentaje",
  "descuento": "numero|porcentaje",
  "buyer_email": "email@example.com"
}
```

**Proceso Interno:**
1. Validación Zod
2. getAuthContext() → obtener usuario
3. getProyecto(proyecto_id) → config cotizador
4. getUnidad(unidad_id) → precio base
5. calcularCotizacion() → usar lib/cotizador/calcular.ts
6. generatePDF() → @react-pdf/renderer
7. uploadToR2() → guardar PDF
8. insertCotizacion() → BD
9. sendCotizacionBuyer() → email buyer
10. sendCotizacionAdmin() → email seller
11. dispatchWebhook() → evento externo

**Dependencias:**
- `proyectos.cotizador_config` - Estrategia pago
- `unidades.precio` - Base de cálculo
- `complementos` table - Precios extras
- `tipologias.precio_desde` - Si usa tipología
- Email service (Resend)
- R2/S3 storage
- Webhooks (si configurado)

**Consumidores:**
- Micrositio (modal cotizador)
- Dashboard (generador)
- IA (podría generar)

**Si cambia:** Cotizaciones rotas, emails sin PDF, webhooks fallan

---

### API: `PUT /api/unidades/[id]`

**Entrada:**
```json
{
  "precio?": 150000,
  "estado?": "disponible|vendida|bloqueada",
  "area_m2?": 85,
  "habitaciones?": 2,
  "custom_field?": "value"
}
```

**Propagación:**
1. Validación Zod
2. UPDATE unidades
3. React Query invalidate: `['unidades', proyecto_id]`
4. Frontend UI re-render (inventario)
5. Si cambió `estado` → analytics invalidate
6. Si cambió `precio` → cotizador recalcula
7. Si cambió de vendida a disponible → webhook?

**Consumidores:**
- `/editor/[id]/inventario` (editar fila)
- CSV import (bulk update)
- IA (modify units)
- Disponibilidad (cambio estado)

**Dependencias críticas:**
- Si `estado` → "vendida" y `ocultar_vendidas` = true
  → Afecta visibilidad micrositio
- Si `precio` cambió → Afecta todas cotizaciones futuras de esta unidad
- Si `tipologia_id` cambió → Afecta búsqueda por tipo

**Si cambia:** Micrositio desincronizado, precios inexactos, orfandad

---

## 🎨 DEPENDENCIAS DE COMPONENTES

### Micrositio: Flujo de Cotizador

```
/sites/[slug]/*
  ├── SiteLayoutClient (proveedor contexto)
  │   └── CurrencyProvider (conversión monedas)
  │       └── Componente página (ej: inventario)
  │           └── Tarjeta unidad
  │               └── Click → Modal cotizador abre
  │                   ├── calcularCotizacion() [puro, sin efectos]
  │                   │   └── unidad.precio
  │                   │   └── complementos (si + al total)
  │                   │   └── descuentos
  │                   │   └── fases de pago
  │                   ├── Form inputs (complementos, descuento)
  │                   ├── Display presupuesto actualizado
  │                   └── Click "Generar PDF"
  │                       └── POST /api/cotizaciones
  │                           └── Cotización guardada
  │                           └── Email enviado
  │                           └── Webhook dispara (si config)
  │                           └── Toast "PDF enviado a tu email"
```

**Componentes involucrados:**
1. **SiteLayoutClient.tsx** - Proveedor contexto proyecto
2. **Página (ej: inventario/page.tsx)** - Layout
3. **Card unidad** - Trigger modal
4. **Modal cotizador** - Interfaz
5. **CurrencySelector.tsx** - Cambiar moneda
6. **Calcular.ts** - Lógica pura

**Si cambias calcular.ts:**
- Toda cotización recalcula
- Micrositio, dashboard, emails afectados

**Si cambias SiteProjectContext:**
- Todas las páginas micrositio se rompen

**Si cambias estructura unidad:**
- Card unidad falla
- Cotizador falla
- Micrositio inventario se rompe

---

### Dashboard: Flujo de Edición de Proyecto

```
/(dashboard)/editor/[id]
  ├── EditorProjectProvider
  │   └── Página layout (navigation tabs)
  │       ├── GeneralTab.tsx [editar proyecto metadata]
  │       │   └── useEditorProject() → proyecto
  │       │   └── onChange → estado local
  │       │   └── autoSave 500ms → PUT /api/proyectos/[id]
  │       │
  │       ├── TipologiasTab.tsx [editar tipologías]
  │       │   └── Lista tipologías
  │       │   └── Modal crear/editar
  │       │   └── POST/PUT /api/tipologias
  │       │
  │       ├── InventarioTab.tsx [editar unidades]
  │       │   └── Grid/tabla unidades
  │       │   └── Editable cells
  │       │   └── CSV import via SmartImportModal
  │       │   └── Bulk update
  │       │
  │       ├── GaleriaTab.tsx [editar galería]
  │       │   └── Categorías
  │       │   └── Imágenes por categoría
  │       │   └── Upload modal
  │       │   └── POST /api/galeria/imagenes
  │       │
  │       └── ... 17 más tabs
```

**Componentes clave:**
1. **useEditorProject()** - Caché proyecto + save()
2. **Tab components** - Cada uno edita una sección
3. **Save logic** - Debounce + auto-save

**Si cambias tipo de dato:**
- Tab component falla
- API validation falla
- useEditorProject caching se rompe

**Si cambias permisos:**
- Colaboradores no pueden editar
- Admin ve opciones extra

---

## 🔄 FLUJOS TRANSVERSALES CRÍTICOS

### FLUJO 1: Crear y Publicar un Proyecto

```
1. User hace click "Crear Proyecto"
2. POST /api/proyectos {nombre, constructora, color}
3. Backend:
   - Valida con Zod
   - INSERT INTO proyectos
   - Genera slug único
   - Retorna ID nuevo
4. Frontend:
   - useProjectsQuery invalidate (React Query)
   - Redirige a /(dashboard)/editor/[id]
5. EditorProjectProvider carga proyecto
6. User edita en tabs: config, tipologías, galería, etc
7. Cada cambio → debounce 500ms → PUT /api/proyectos/[id]
8. User completa secciones requeridas
9. Click "Publicar"
   - POST /api/proyectos/[id]/publicar
   - estado = "publicado"
   - Webhook "proyecto.publicado" (si config)
10. Micrositio ahora accesible en /sites/[slug]/

Dependencias:
  - Proyecto nuevo → impacta lista (/proyectos)
  - Proyecto publicado → impacta disponibilidad micrositio
  - Publicación → impacta webhook externo
```

**Puntos de fallo:**
- ❌ INSERT falla → no se crea proyecto
- ❌ Slug colisión → error
- ❌ Validación Zod → cambios se pierden
- ❌ PUT falla → cambios no se guardan
- ❌ Publicación sin config → micrositio vacío
- ❌ Webhook falla → integración no funciona

---

### FLUJO 2: Generar Cotización (Micrositio + Backend)

```
FRONTEND (micrositio):
1. User navega /sites/[slug]/inventario
2. Selecciona unidad → abre modal cotizador
3. calcularCotizacion() [función PURA]
   - Lee unidad.precio
   - Suma complementos.precio (si + al total)
   - Aplica descuentos
   - Divide por fases
   - Retorna precio_fase_1, precio_fase_2, etc
4. User modifica: complementos, descuento, fases
5. calcularCotizacion() se ejecuta de nuevo
6. Display presupuesto actualizado
7. Click "Generar PDF"
   - Recopila: unidad_id, complementos[], descuento, fases[]
   - POST /api/cotizaciones {datos}

BACKEND (servidor):
8. POST /api/cotizaciones {unidad_id, complementos, descuento, fases}
9. Validación Zod
10. getAuthContext() → usuario + proyecto
11. getUnidad(unidad_id) → verify propietario
12. getProyecto(proyecto_id) → cotizador_config
13. Recalcular cotización (verificación servidor)
    - calcularCotizacion(unidad.precio, complementos[], descuento, fases)
14. Validar resultado = resultado cliente (prevenir manipulación)
15. generatePDF(resultado) → @react-pdf/renderer
    - Incluye: logo, proyecto, unidad, precio, complementos, fases
    - Fuentes + CSS + branding
    - Exporta a PDF bytes
16. uploadToR2() → S3/R2 presigned URL
17. INSERT INTO cotizaciones {unidad_id, pdf_url, data}
18. sendCotizacionBuyer(pdf_url) → email a buyer
    - Incluye PDF attachment
    - Link para descargar
19. sendCotizacionAdmin(pdf_url) → email a seller
20. dispatchWebhook("cotizacion.creada", {payload})
    - Si webhook configurado
    - Incluye PDF URL
21. Retorna a frontend: {id, pdf_url, email_enviado}

FRONTEND:
22. Toast "PDF enviado a {email}"
23. Opcional: mostrar link para descargar ahora

Dependencias CRÍTICAS:
  - unidades.precio → cálculo
  - proyectos.cotizador_config → estrategia
  - complementos table → precios extras
  - email service → envío
  - R2/S3 → almacenamiento PDF
  - @react-pdf/renderer → generación
  - webhooks → integraciones externas

Si cambias:
  - calcular.ts → TODOS los PDFs usan nueva lógica
  - estructura complementos → PDFs viejos incompatibles
  - proyecto.cotizador_config → precio incorrecto
  - unidad.precio → TODOS usan nuevo precio
  - email template → leads no ven instrucciones
  - R2/S3 → PDFs no se guardan
```

---

### FLUJO 3: Importar Unidades desde CSV

```
USER (dashboard):
1. /(dashboard)/editor/[id]/inventario
2. Click "Importar CSV"
3. SmartImportModal abre
4. User sube archivo CSV o pega datos
5. Frontend parsea CSV
6. Muestra preview (primeras 5 filas)
7. User mapea columnas (CSV col → unidad field)
8. Click "Importar"

FRONTEND:
9. POST /api/ai/analyze-csv {csv_data, mapping}
   - IA analiza datos
   - Detecta duplicados potenciales
   - Sugiere correcciones
   - Retorna cleaned data
10. User revisa sugerencias
11. Aprueba importación

BACKEND:
12. POST /api/unidades/bulk {unidades[], proyecto_id}
13. Validación: cada unidad contra Zod
14. Verificación de relaciones:
    - tipologia_id existe?
    - torre_id existe?
    - orientacion_id existe?
    - vista_id existe?
15. Transaction INSERT múltiples
16. Retorna: {created: 150, failed: 2, errors: [...]}

FRONTEND:
17. useQuery invalidate ['unidades', proyecto_id]
18. InventarioTab refetch datos
19. Tabla se repopula con nuevas unidades
20. Toast "Importadas 150 unidades"

Dependencias:
  - tipologias (FK)
  - torres (FK)
  - orientaciones (FK)
  - vistas (FK)
  - IA service → análisis
  - Validación Zod → estructura
  - Transaction DB → atomicidad

Puntos de fallo:
  - ❌ CSV malformado → import falla
  - ❌ FK constraint → algunas unidades fallan
  - ❌ IA timeout → tiempo espera
  - ❌ Transaction rollback → ninguna se crea
  - ❌ Duplicados no detectados → datos basura
```

---

## 📈 MATRIZ DE IMPACTO

### Cambiar `unidades.precio`

| Sistema | Impacto | Severidad | Afectados |
|---------|---------|-----------|-----------|
| Micrositio | Inventory display actualiza | 🔴 ALTO | Buyers ven precio nuevo |
| Cotizador | Nuevas cotizaciones usa nuevo precio | 🔴 ALTO | PDF generado con precio incorrecto si viejo |
| Cotizaciones viejas | PDF viejo tiene precio viejo | 🟡 MEDIO | Inconsistencia histórica |
| Analytics | Revenue recalcula | 🟡 MEDIO | Datos financieros afectados |
| Dashboard | Tabla inventario actualiza | 🟢 BAJO | Admin ve nuevo precio |
| Búsqueda | Si hay filtro precio → resultados actualizan | 🟡 MEDIO | Buyers ven/no ven según rango |

**Acción requerida:**
- ✅ Hacer cambio atomático (single UPDATE)
- ✅ Invalidar caché React Query
- ✅ Notificar via email a admin
- ❌ NO regenerar cotizaciones viejas (historial)
- ✅ Crear audit log del cambio

---

### Cambiar `proyectos.color_primario`

| Sistema | Impacto | Severidad | Afectados |
|---------|---------|-----------|-----------|
| Micrositio | CSS variables actualizan | 🟢 BAJO | Aspecto visual solo |
| Buttons | Botones usan color | 🟢 BAJO | Visual |
| Dashboard | Branding components | 🟢 BAJO | Visual |
| PDF cotización | Logo/branding | 🟡 MEDIO | Nuevas cotizaciones con nuevo color |
| Marketing | Si existe branding | 🟢 BAJO | Visual |

**Acción requerida:**
- ✅ Cambio seguro, refresca CSS vars
- ✅ Nuevas cotizaciones con nuevo color
- ✅ Cotizaciones viejas mantienen color viejo (OK)

---

### Cambiar `tipologias.area_m2`

| Sistema | Impacto | Severidad | Afectados |
|---------|---------|-----------|-----------|
| Micrositio | Renders/specs actualizan | 🟡 MEDIO | Buyers ven nueva área |
| Unidades | Si es base de cálculo | 🟡 MEDIO | Disponibles para venta |
| Búsqueda/Filtro | Si hay filtro área | 🔴 ALTO | Cambió resultado búsqueda |
| Comparador | Si existe sección | 🟡 MEDIO | Comparación actualiza |
| Analytics | Estadísticas por tamaño | 🟡 MEDIO | Datos históricos inconsistentes |
| PDF | Si incluye en specs | 🟡 MEDIO | Nuevas cotizaciones correctas |

**Acción requerida:**
- ✅ Cambio seguro pero documentado
- ✅ Notificar de cambios a buyers/agentes
- ❌ No actualizar cotizaciones viejas
- ✅ Audit log del cambio

---

### CAMBIO PELIGROSO: Cambiar estructura `complementos`

| Sistema | Impacto | Severidad | Afectados |
|---------|---------|-----------|-----------|
| Cotizador | Cálculo se rompe | 🔴 CRÍTICO | TODAS las nuevas cotizaciones |
| PDF | Estructura JSON incompatible | 🔴 CRÍTICO | PDFs no generan |
| Email | Template falla | 🔴 CRÍTICO | Mails no envían |
| BD | RLS policies rompen | 🔴 CRÍTICO | Queries fallan |
| Dashboard | Config cotizador falla | 🔴 CRÍTICO | Admin no puede editar |
| Webhooks | Payload estructura cambia | 🔴 CRÍTICO | Integraciones externas fallan |

**Acción requerida:**
- ⚠️ REQUIERE MIGRACIÓN CON CONVERSION
- ⚠️ REQUIERE UPDATE A TODAS COTIZACIONES VIEJAS
- ⚠️ REQUIERE COMUNICACIÓN A INTEGRADORES
- ⚠️ REQUIERE FEATURE FLAG TEMPORALMENTE
- ⚠️ REQUIERE ROLLBACK PLAN
- ⚠️ HACER EN HORARIO LOW-TRAFFIC
- ✅ ANTES: Snapshot/backup BD
- ✅ TESTS EXHAUSTIVOS

---

## 🛡️ GUÍA DE CAMBIOS SEGUROS

### BAJO RIESGO (Low Risk Changes)

Puedes hacer sin notificación:

```
✅ Cambiar color_primario → visual solo
✅ Cambiar descripción del proyecto → text only
✅ Cambiar logo → visual
✅ Cambiar email contacto → metadata
✅ Cambiar secciones_visibles → feature flags
✅ Agregar nuevo punto de interés → aditivo
✅ Agregar nueva categoría galería → aditivo
✅ Cambiar posición elemento → CSS layout
✅ Cambiar fuente tipografía → visual
```

**Checklist:**
- [ ] Cambio es aditivo o visual
- [ ] No afecta cálculos críticos
- [ ] No afecta tablas relacionadas
- [ ] Tests pasan
- [ ] No requiere migración BD

---

### MEDIO RIESGO (Medium Risk Changes)

Requiere test + notificación:

```
⚠️ Cambiar area_m2 tipología → puede afectar búsqueda/comparador
⚠️ Cambiar nombre campo → Requiere migración
⚠️ Cambiar enum status → Requiere migración + validación
⚠️ Agregar campo requerido → Requiere default o migración
⚠️ Cambiar fórmula en calcular.ts → Afecta todas las cotizaciones futuras
⚠️ Cambiar email template → Afecta todos los emails nuevos
⚠️ Cambiar RLS policy → Puede romper acceso
```

**Checklist:**
- [ ] Escribir migración (si BD)
- [ ] Actualizar tests
- [ ] Verificar datos existentes no se rompen
- [ ] Probar en staging primero
- [ ] Notificar a team si es componente compartida
- [ ] Documentar cambio en git commit

---

### ALTO RIESGO (High Risk Changes)

**REQUIERE PLANIFICACIÓN EXHAUSTIVA:**

```
🔴 Cambiar estructura tabla principal (proyectos/unidades)
🔴 Cambiar algoritmo cotizador
🔴 Cambiar estructura complementos
🔴 Cambiar esquema de autenticación
🔴 Cambiar RLS policies critically
🔴 Eliminar columna usada
🔴 Cambiar tipo dato existente (string→number)
🔴 Mover datos entre tablas
```

**Checklist OBLIGATORIO:**
- [ ] Snapshot BD antes del cambio
- [ ] Plan de rollback documentado
- [ ] Migración escrita + tested
- [ ] Data migration script escrito + tested
- [ ] Tests exhaustivos (unit + integration)
- [ ] Staging test con volumen de datos real
- [ ] Notificación a stakeholders
- [ ] Ventana de cambio acordada
- [ ] On-call durante cambio
- [ ] Comunicación post-cambio a users/integradores

**Ejemplo: Cambiar estructura complementos**

```sql
-- ANTES:
complementos = [
  {id: "pk1", nombre: "Jacuzzi", precio: 50000}
]

-- DESPUÉS:
complementos = {
  pk1: {nombre: "Jacuzzi", precio: 50000}
}
```

**Pasos:**
1. Crear nuevo campo `complementos_v2` con nueva estructura
2. Script de migración que convierte TODOS los registros
3. Tests verifican conversión correcta
4. Feature flag: usa v1 o v2?
5. Deploy con flag OFF
6. Migrate data (con script)
7. Tests en producción con v2 en small % (canary)
8. Gradualmente aumentar % a 100%
9. Eliminar campo v1
10. Limpiar código v1

**Comunicación:**
- Integradores: "Estructura JSON cambia en {fecha}"
- Buyers: no se enteran (backend)
- Team: daily standup updates

---

## 🔍 CÓMO USAR ESTE MAPA

### Scenario 1: "Necesito cambiar el precio de una unidad"

1. Ve a sección **Cambios de Esquema → Agregar campo a unidades** (si es nueva columna)
   O ve a **TABLA: unidades** → Lectores/Escritores
2. Identifica que afecta:
   - Micrositio (display) ✅
   - Cotizador (cálculo) ✅ CRITICAL
   - Analytics (revenue) ✅
   - Dashboard (tabla) ✅
3. Riesgo: 🟡 MEDIO (solo precio, no estructura)
4. Acción:
   - [ ] Cambiar en DB
   - [ ] Invalidar React Query caché
   - [ ] Cotizaciones nuevas usan nuevo precio
   - [ ] Cotizaciones viejas mantienen viejo (OK)
   - [ ] Audit log

### Scenario 2: "Quiero agregar un field nuevo a unidades"

1. Ve a **Cambios de Esquema → Agregar campo a unidades**
2. Sigue el checklist
3. Actualiza interfaces en `src/types/index.ts`
4. Actualiza API routes
5. Actualiza micrositio si visible
6. Tests

### Scenario 3: "Un cambio rompe la generación de PDFs"

1. Ve a **FLUJO 2: Generar Cotización**
2. Identifica qué falló:
   - [ ] calcular.ts? (lógica)
   - [ ] @react-pdf? (generación)
   - [ ] complementos JSON? (parsing)
   - [ ] email? (envío)
3. Revertsion en MATRIZ DE IMPACTO
4. ALTO RIESGO → Requiere rollback

### Scenario 4: "Voy a cambiar la lógica del cotizador"

1. Ve a **FLUJO 2** (completo)
2. Riesgo: 🔴 CRÍTICO
3. Afecta:
   - Todas cotizaciones nuevas ✅
   - Cotizaciones viejas no se recalculan ✅
   - PDFs futuros con nueva lógica ✅
   - Emails futuros con nueva lógica ✅
4. Checklist:
   - [ ] Tests unitarios para nueva lógica
   - [ ] Tests con precios reales (COP/USD)
   - [ ] Tests con complementos edge cases
   - [ ] Staging test con project real
   - [ ] Comparar PDF viejo vs nuevo
   - [ ] Verificar email template
5. Deploy:
   - [ ] Feature flag OFF
   - [ ] Deploy a staging
   - [ ] Tests pasan
   - [ ] Deploy a prod con flag OFF
   - [ ] Feature flag ON (cuando ready)
   - [ ] Monitor error rate

---

## 📚 REFERENCIAS CRUZADAS

- [CLAUDE.md](CLAUDE.md) - Arquitectura general
- [src/types/index.ts](src/types/index.ts) - Interfaces
- [src/lib/cotizador/](src/lib/cotizador/) - Motor cotizador
- [supabase/migrations/](supabase/migrations/) - Cambios BD
- [src/app/api/](src/app/api/) - Endpoints
- [src/components/](src/components/) - Componentes

---

**Última actualización:** 2026-04-09  
**Mantenedor:** Claude Code  
**Próxima revisión:** Después de cambios schema importantes
