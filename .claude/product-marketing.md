# NODDO Product Marketing Context

**Última actualización:** 2026-03-15

---

## ¿Qué es NODDO?

NODDO es una **plataforma SaaS B2B para desarrolladores inmobiliarios (constructoras)** que permite crear y gestionar **micrositios premium digitales** para proyectos de construcción en etapa de pre-venta.

**NO es:**
- ❌ Un website builder genérico
- ❌ Un CRM inmobiliario
- ❌ Software 3D para tours virtuales
- ❌ Una plataforma de anuncios clasificados

**SÍ es:**
- ✅ Un **sistema integrado de ventas digitales** que reemplaza brochures PDF, hojas Excel de disponibilidad, formularios genéricos y herramientas de analytics separadas
- ✅ Una **sala de ventas 24/7** que permite a compradores explorar proyectos de forma autónoma e interactiva
- ✅ Una **plataforma de gestión de inventario en tiempo real** con tracking visual de disponibilidad
- ✅ Un **sistema de captura y calificación de leads** con contexto comportamental y atribución UTM

---

## Target Audience (ICP)

### Cliente Principal: Constructoras en Latinoamérica
**Perfil:**
- Desarrolladores inmobiliarios con proyectos en **pre-venta** (preventa = vender antes de construir, usando renders arquitectónicos)
- Tamaño: Desde boutique (40 unidades) hasta grandes desarrollos (450+ unidades)
- Geografía: Colombia (primario), México, Perú, Miami
- Segmento: VIS (Vivienda de Interés Social), VIP (vivienda premium), mixtos

**Roles de decisión:**
1. **Director Comercial** — Responsable de ventas, necesita leads calificados y velocidad de cierre
2. **Gerente General / Junta Directiva** — Aprueba inversión, busca ROI vs agencias
3. **VP de Proyectos** — Maneja múltiples desarrollos simultáneos, necesita centralización

**Pain Points actuales:**
1. **Brochures PDF estáticos** — Renders caros ($80M+ en producción CGI) terminan en PDFs que nadie ve completos
2. **Proceso fragmentado** — Brochure aquí, planos allá, disponibilidad en Excel enviado por WhatsApp
3. **Sales rep pierde tiempo buscando archivos** — Durante presentación presencial, abre laptop, busca Excel actualizado, PDF del brochure, carpeta de renders → comprador espera, momento de venta se pierde
4. **Comprador quiere info a las 11pm** — Oficina cerrada, no hay nadie que responda, se va a la competencia que tiene microsite 24/7
5. **Leads sin contexto** — Formularios genéricos ("Quiero información") sin saber QUÉ unidad interesa, DE QUÉ campaña vino, CUÁNTO tiempo exploró
6. **Agencias caras y lentas** — $30k-$80k USD, 3-6 meses de desarrollo, cambios requieren pagar más
7. **Disponibilidad desactualizada** — Cliente pregunta por unidad 302, "déjame revisar el Excel", "ay no, esa se vendió la semana pasada"

---

## Problema Central que NODDO Resuelve

### El Problema (The Switch)

**Antes:** El comprador **pedía información** (pasivo). Llamaba a oficina de ventas, agendaba cita, le mostraban renders en PowerPoint.

**Ahora:** El comprador **busca información** (activo). Googlea el proyecto a las 11pm desde su celular, quiere ver disponibilidad YA, no quiere esperar a que un asesor lo llame.

**Consecuencia:** Si tu proyecto NO tiene showroom digital donde el comprador puede explorar solo:
- Pierdes al 87% de compradores que nunca abren tu PDF completo
- Pierdes leads que se van a proyectos de la competencia con mejor experiencia digital
- Tu equipo de ventas gasta 47% del tiempo buscando archivos en lugar de vender

**La Solución:** NODDO convierte renders estáticos en una **sala de ventas interactiva 24/7** que funciona en DOS escenarios:

**Escenario 1: Herramienta de presentación para sales reps (presencial)**
- Sales rep abre un solo link en tablet → TODO está ahí (inventario, planos, disponibilidad, cotizador)
- No más buscar Excel, no más "déjame revisar si está disponible", no más PowerPoints desactualizados
- Genera cotización en vivo → PDF enviado al email del comprador al instante
- Cierre de venta más rápido porque el momento NO se pierde buscando archivos

**Escenario 2: Auto-servicio para compradores (remoto 24/7)**
- Comprador hace clic en el edificio → ve qué unidades hay, precios, planos, disponibilidad
- Puede cotizar una unidad específica → recibe PDF con plan de pagos al instante
- Sales rep recibe lead PRE-CALIFICADO: "Juan exploró la unidad 802, 2BR, piso 8, vio el plan de pagos, dejó su WhatsApp"

---

## Cómo Funciona NODDO (End-to-End)

### Flujo Completo: De Cero a Microsite en Vivo

#### **Día 1: Creación del Proyecto**

**Opción A: AI Creator (Conversacional)**
1. Constructora sube PDF del brochure o describe proyecto en chat
2. IA extrae datos estructurados:
   - Nombre proyecto, ubicación (geocoded), descripción
   - Tipologías (tipos de unidades: Studio 45m², 1BR 62m², 2BR 85m²)
   - Specs: área, habitaciones, baños, precio
   - Paleta de colores (extrae del brochure)
   - POIs cercanos (descubre automáticamente: "Metro a 500m, Parque El Virrey a 2km")
3. Preview panel muestra datos extraídos → constructora confirma → proyecto creado

**Opción B: Manual**
1. Modal: nombre del proyecto → auto-genera slug (alto-de-yeguas → `alto-de-yeguas.noddo.io`)
2. Proyecto creado en estado "borrador"

#### **Días 2-3: Población de Contenido (Editor)**

**Editor Structure:**
- 📁 **PROYECTO**: General, Inicio (hero), Constructora, Diseño (colores), Avanzado, Torres
- 📁 **CONTENIDO**: Tipologías, Inventario, Grid (fachadas/plantas), Implantaciones, Galería, Videos, Tour 360°, Ubicación, Recursos, Avances
- 📁 **AJUSTES**: Configuración, Dominio, Webhooks
- 📁 **DATOS**: Estadísticas, Leads
- 📁 **HERRAMIENTAS**: Disponibilidad, Cotizador

**Contenido clave a subir:**
1. **Tipologías** (tipos de unidades):
   - Renders de cada tipo (sala, cocina, habitación)
   - Planos con hotspots interactivos
   - Specs: área, habitaciones, baños, precio "desde"
   - Características (tags): Vista al mar, Cocina integral, Balcón, etc.

2. **Inventario** (unidades específicas):
   - Crear unidades manualmente O bulk import CSV O usar **AI Unit Generator**
   - AI Generator: *"Torre de 15 pisos, 4 unidades por piso (A/B/C/D), planta baja es lobby, sótano tiene 20 parqueaderos P1-P20"*
   - AI crea: 60 unidades residenciales + 20 parqueaderos con IDs auto-generados (1A, 1B, ..., 15D, P1, ..., P20)
   - Cada unidad: ID, piso, área, precio, estado (disponible/separado/reservada/vendida), orientación, vista

3. **Noddo Grid** (LA FEATURE CLAVE):
   - **Simple mode** (un edificio):
     - Sube imagen de fachada
     - Arrastra unidades del inventario → coloca hotspots en la imagen (ventanas/puertas)
     - Cada hotspot = posición (x%, y%) + unidad vinculada
     - Sistema de Planta Tipo: Crea plano piso 2 → asigna pisos 3-15 a esa plantilla → todos heredan layout
   - **Multi-Torre mode** (varios edificios):
     - Implantación (master plan) con markers por torre
     - Cada torre tiene sus propias fachadas/plantas
     - Tab navigation entre torres

4. **Galería**: Categories (Renders, Amenidades, Locación, Avances) + bulk upload imágenes

5. **Ubicación**: Address autocomplete → geocoding → AI descubre POIs (colegios, centros comerciales, parques, metro)

6. **Cotizador** (Premium feature):
   - Define **fases de pago**: Separación ($5M fijo), Cuota inicial (30% en 6 cuotas mensuales), Contra entrega (Resto)
   - Preview live con unidad más barata disponible
   - Genera PDFs con plan de pagos personalizado

#### **Día 4: Configuración y Publicación**

1. **Config WhatsApp**: Número de contacto (+57 300 123 4567) → botón flotante en microsite
2. **Custom Domain** (Premium/Enterprise): Configura `altodeyeguas.com` → verifica DNS CNAME
3. **Click "Publicar"**:
   - Sistema crea **snapshot versión** (v1) con todo el contenido
   - Sets estado = "publicado"
   - Microsite INSTANTLY accesible en:
     - `alto-de-yeguas.noddo.io`
     - `altodeyeguas.com` (si custom domain configurado)

**Resultado:** Proyecto publicado en 1 día (vs 3-6 meses con agencia).

---

## El Microsite: Dos Casos de Uso

### Caso 1: Sales Rep en Sala de Ventas (Presencial)
**Escenario:** Comprador llega a oficina de ventas / model apartment

1. **Sales rep abre microsite** en tablet/laptop (`proyecto.noddo.io`)
2. **Presentación guiada**:
   - "Mira, estas son nuestras tipologías" → navega a `/tipologias`
   - "Tenemos estas unidades disponibles en piso 8" → filtra inventario
   - "Esta es la 802, corner, oeste, $450M" → click en Grid
   - "Aquí está tu plan de pagos" → genera cotización en vivo
3. **PDF enviado al instante** a email del comprador
4. **Value prop**: Todo centralizado en un link vs buscar Excel + PDF + renders en carpetas separadas

**Pain point resuelto:** Sales rep NO pierde tiempo buscando archivos, abriendo PowerPoint, revisando Excel desactualizado. Todo está en el microsite, siempre actualizado.

### Caso 2: Comprador Curioso desde Casa (Remoto)
**Escenario:** Comprador ve ad en Facebook, son las 11pm, está en el sofá

1. Click en ad → llega a `proyecto.noddo.io`
2. **Auto-exploración sin intermediario**:
   - Navega galería, tipologías, ubicación
   - Filtra inventario por sus criterios (2BR, piso 8+, disponible)
   - Click en unidad en Grid → ve disponibilidad real-time
   - Genera cotización → llena form → recibe PDF
3. **Lead capturado** con contexto (unidad de interés, tiempo en sitio, fuente)
4. **Sales rep contacta al día siguiente** con contexto: "Vi que exploraste la 802..."

**Pain point resuelto:** Comprador NO espera a que oficina abra a las 9am. Explora cuando quiere, recibe info al instante, se auto-califica.

---

## El Microsite: Experiencia Común (Ambos Casos)

### Landing (First Impression)
1. Usuario (sales rep O comprador) visita `proyecto.noddo.io` o custom domain
2. **Fullscreen hero** con:
   - Video background (o imagen con Ken Burns animation)
   - Gradient oscuro para legibilidad
   - Logo del proyecto + nombre + descripción
   - CTA dorado: "INGRESAR A LA EXPERIENCIA" con shimmer
3. Click → exit animation (1.6s) → entra a galería

### Navegación (Sidebar Collapsible)
- **Desktop**: Sidebar izquierdo con 11 secciones (Galería, Tipologías, Inventario, Explorar, Implantaciones, Ubicación, Videos, Recursos, Avances, Tour 360°, Contacto)
- **Mobile**: Hamburger menu → full-screen overlay
- **Active indicator**: Barra vertical dorada animada

### Noddo Grid (Explorar) — LA KILLER FEATURE
**Layout:**
- Izquierda (fullscreen): Imagen de fachada/planta con hotspots clickables
- Derecha (sidebar): Lista de unidades con filtros

**Interacción:**
1. Comprador ve fachada del edificio
2. Cada unidad = **hotspot pulsante** (color = estado):
   - Verde = disponible (pulsa)
   - Amarillo = separado
   - Naranja = reservada
   - Gris = vendida
3. Click en hotspot → **unit detail banner overlay**:
   - ID, tipología, área, piso, habitaciones, baños, vista, precio
   - Botón **"Cotizar"** → abre modal con plan de pagos
4. **Multi-torre**: Mini implantación (bottom-left) muestra layout del conjunto → click en torre → cambia fachada
5. **Planta view**: Toggle fachada ↔ planta → selector de pisos (P1, P2, P3...)

**Diferencia vs PDF:** Comprador explora VISUALMENTE en el edificio real vs. leer tabla de disponibilidad.

### Tipologías (Floor Plans)
- **Layout**: Plano izquierda, specs + unidades derecha
- **Hotspots en plano**: Click en sala → modal fullscreen con render de esa habitación
- **Unit list**: Filtrado por estado (disponible/separado/reservada/vendida)
- **"Desde" price**: Calculado dinámicamente desde la unidad disponible más barata (NO precio fijo)

### Inventario (Catálogo Completo)
- **Filters**: Torre, tipología, habitaciones, baños, estado, search (ID/view/orientation)
- **Sort**: Piso ↑↓, Precio ↑↓, Área ↑↓
- **Views**: Grid cards O List table
- **Acciones por unidad**: Ver en tipologías (eye icon), Cotizar (sparkles icon)

### Ubicación (Mapbox Satellite)
- **Map**: Fullscreen Mapbox con marker dorado pulsante en el proyecto
- **POIs**: Markers blancos para puntos de interés (shopping, parques, colegios, metro)
- **Click POI** → flyTo animation → sidebar muestra: foto, descripción, distancia (km), tiempo (min)
- **"Cómo llegar" button** → Google Maps directions

### Lead Capture (3 Canales)
**Canal 1: Contacto Page**
- Form: nombre, email, teléfono (country code dropdown), tipología de interés, mensaje
- Auto-captura: UTMs (source/medium/campaign), referrer, timestamp

**Canal 2: CotizadorModal** (Unit-Specific)
- Triggered desde: Explorar (click hotspot → "Cotizar"), Tipologías (click unit), Inventario (sparkles icon)
- **Flow A (Enhanced)**: Muestra plan de pagos completo (Separación, Cuota inicial, Financiación) → form (nombre, email, WhatsApp) → genera PDF → envía a comprador + sales team
- **Flow B (Legacy)**: Simple lead form con unidad pre-filled en mensaje

**Canal 3: WhatsApp Button**
- Fixed bottom-right en todas las páginas (excepto landing)
- Click → `wa.me` con mensaje pre-llenado: "Hola, estoy interesado en [Proyecto]"
- Tracking: `whatsapp_click` event

**Datos capturados:**
- Nombre, email, teléfono, país
- **Tipología/Unidad de interés** (específica)
- UTM source/medium/campaign
- Behavioral tracking: páginas vistas, tiempo en sitio, videos reproducidos

**Diferencia vs PDF:** 3 paths de conversión (form, quote, WhatsApp) con contexto comportamental vs. PDF sin tracking.

---

## Inventario en Tiempo Real (Cómo Funciona)

### Estados de Unidad
1. **Disponible** (verde) — Lista para venta
2. **Separado** (amarillo) — Cliente expresó interés, pendiente pago
3. **Reservada** (naranja) — Depósito pagado, pendiente contrato final
4. **Vendida** (rojo/gris) — Completamente vendida

### Actualización en Tiempo Real
1. Asesor de ventas marca unidad 802 como "vendida" en dashboard `/disponibilidad`
2. **Postgres trigger** (`track_unidad_state_change()`) dispara → crea registro en `unidad_state_history`:
   - `changed_by: auth.uid()` (quién hizo el cambio)
   - `created_at: now()` (cuándo)
   - Snapshot: precio, área, tipología en ese momento
3. Next.js SSR fetches fresh data en cada page load → **microsite muestra "vendida" al instante**
4. No caching delay, no manual refresh needed

**Tracking para Analytics:**
- `sold_at` timestamp → permite calcular **sales velocity** (unidades/mes)
- **Revenue chart**: agrupa unidades vendidas por mes, suma precios
- **Available inventory value**: suma precios de unidades disponibles

**Diferencia vs Excel/PDF:**
- Excel: Sales team actualiza local, envía por email → prospects tienen data desactualizada
- NODDO: Single source of truth → cambio en dashboard = cambio en microsite instantáneo

---

## Diferenciación Real (No Marketing Fluff)

### 1. **Noddo Grid** — Genuinamente Único
**Qué es:** Sistema de visualización donde constructoras suben imagen de fachada/planta + clickean para asignar unidades a posiciones específicas.

**Por qué es único:**
- **Clickable building visual**: Hotspots con coordenadas (x%, y%) en DB, renderizados como dots sobre imagen
- **Multi-view**: Soporta fachada (exterior) Y planta (floor plan) con coordenadas separadas (`fachada_x/y`, `planta_x/y`)
- **Real-time overlay**: Estado visual (green/yellow/orange/gray) directamente en la imagen del edificio
- **vs Static image**: PDFs tradicionales requieren cross-reference entre imagen y tabla de disponibilidad

**Ventaja real:** Compradores se auto-califican explorando visualmente. Sales team no gasta tiempo explicando "dónde queda la 302" — el comprador ya sabe.

### 2. **Real-time Inventory** — SÍ es Tiempo Real
**Cómo funciona:**
- Postgres trigger captura CADA cambio de estado → audit trail completo
- Next.js SSR fetches fresh data en cada load (no caching)
- History table permite analytics: cuándo se vendió, a qué precio, quién la vendió

**vs Métodos tradicionales:**
- PDF: Actualizado manualmente, re-enviado a todos (outdated by days/weeks)
- Excel: Local updates, shared by email → no single source of truth
- NODDO: Admin changes → microsite updates instantly

**Ventaja real:** Previene double-booking. Sales velocity auto-calculated (units/month).

### 3. **Lead Qualification** — Datos Específicos Capturados
**Qué captura:**
- **Contexto de unidad**: Tipología/unidad específica que exploraron
- **Source attribution**: UTM params auto-captured
- **Behavioral data**: Tiempo en sitio, páginas vistas, videos reproducidos

**Por qué "más calificados":**
- Lead form se muestra DESPUÉS de explorar unidades → no es cold traffic
- Sales team sabe: "Juan exploró 2BR en piso 8, vio plan de pagos, dejó WhatsApp" vs. "Juan quiere información"

**vs Forms genéricos:**
- Generic: Solo nombre + email, zero context
- NODDO: Unit interest + source + behavior = pre-contextualized call

**Ventaja real:** Higher conversion porque llamadas son pre-contextualizadas. "Vi que exploraste las 2BR en piso 5, déjame mostrarte..."

### 4. **Speed to Market: "1 día" vs "3-6 meses"**
**Por qué 1 día es realista:**
- **No custom dev**: Features pre-built, solo upload content
- **No design phase**: Design system fixed (dark luxury, gold), solo customizas logo + color
- **No agency back-and-forth**: Self-service dashboard

**vs Custom agency site:**
- Agency: Discovery (2 weeks) → Design (3 weeks) → Revisions (2 weeks) → Dev (6 weeks) → QA (2 weeks) → Deploy (1 week) = 16 weeks minimum
- NODDO: Upload content → Done (1 día si content ready)

**Ventaja real:** Launch pre-sales 5 meses antes = captura early-bird buyers. Cada semana de delay es lost sales velocity.

### 5. **vs Brochure PDF**

| Feature | PDF | NODDO |
|---------|-----|-------|
| Availability updates | Manual re-send | Real-time auto-update |
| Unit exploration | Page-by-page search | Click on building visual |
| Lead capture | No form (separate email) | Integrated with UTM tracking |
| Mobile | Pinch-zoom, heavy download | Responsive, lazy-loaded |
| Analytics | Zero visibility | Pageviews, time, unit interest |
| Sharing | Email attachment (gets lost) | URL (shareable via WhatsApp/social) |

**Ventaja real:** PDF = static one-way communication. NODDO = interactive, tracks behavior, converts to leads.

### 6. **vs Custom Agency Site** — Por Qué Más Rápido/Barato

**Agency costs:**
- Design: $5k–$15k
- Dev: $10k–$50k
- Hosting: $50–$200/mo
- Maintenance: $500–$2k/mo
- Timeline: 3–6 months
- **Year 1 total:** $25k–$100k

**NODDO costs:**
- Premium: $149/mo = $1,788/year (includes everything: videos, maps, analytics, custom domain)
- **Year 1 total:** <$2k

**Por qué más barato:**
- No custom dev → SaaS subscription, no hourly dev rates
- Reusable infrastructure

**Trade-off:** Menos customización (design system fijo) pero 10x–50x cost savings + 30x faster.

### 7. **vs 3D Software (Matterport/Unreal)** — Qué Hace Mejor NODDO

**3D software limitations:**
- **Slow to produce**: Matterport scan requiere horas + acceso físico al sitio (NO funciona pre-construcción)
- **No CRM integration**: 3D tour es silo → no sabes QUIÉN vio, QUÉ unidades exploró, DE DÓNDE vino
- **No inventory management**: 3D walkthrough no muestra "esta unidad está vendida"

**NODDO approach:**
- **Renders-first**: Usa renders arquitectónicos (constructora ya los tiene). No physical scan needed.
- **Integrated inventory**: Grid muestra disponibilidad DENTRO de la visual experience
- **Lead capture**: Todo tracked → sabes quién vio qué

**Cuándo usar cada uno:**
- Matterport: Para model apartments (post-construcción)
- NODDO: Para pre-venta cuando solo tienes renders

**Ventaja real:** NODDO funciona en PRE-SALES stage, cuando 3D software no puede (no hay edificio físico aún).

---

## Value Proposition Real

NODDO NO es un website builder. Es un **sistema integrado de ventas digitales para pre-construcción inmobiliaria** que reemplaza:

1. ❌ **PDF brochures** → ✅ Microsite interactivo 24/7
2. ❌ **Excel availability sheets** → ✅ Real-time inventory con visual grid
3. ❌ **Generic contact forms** → ✅ Lead capture con contexto comportamental
4. ❌ **Separate analytics tools** → ✅ Integrated tracking (UTMs, behavior, conversions)
5. ❌ **Manual quote generation** → ✅ Instant PDF payment plans

**Ecuación de valor:**
- **Speed**: 1 día vs 3-6 meses (launch pre-sales 5 meses antes)
- **Cost**: $1.8k/year vs $25k-$100k (50x savings)
- **Lead quality**: 2.4x más leads calificados (contexto comportamental)
- **Sales velocity**: -47% tiempo buscando archivos, +3x tiempo vendiendo
- **Availability accuracy**: Real-time updates → previene double-booking

---

## Customer Journey Completo

### Journey 1: Sales Rep Usa NODDO en Presentación Presencial
1. **Comprador llega a oficina** (agendó cita, 3pm)
2. **Sales rep abre microsite** en tablet: `altodeyeguas.com`
3. **Presentación guiada** (10-15 minutos):
   - "Mira, este es el proyecto" → Galería con renders
   - "Estas son las tipologías" → Planos interactivos, click en habitaciones
   - "Tenemos estas unidades disponibles ahora" → Inventario filtrado (2BR, piso 8+)
   - "Esta es la 802, corner, vista oeste" → Click en Grid, ve posición en edificio
   - "Aquí está tu plan de pagos" → Cotizador con separación $10M, 36 cuotas $12M
4. **Form**: Sales rep llena nombre + email del comprador → genera PDF
5. **Email enviado** al instante: "Cotización Alto de Yeguas - Unidad 802.pdf"
6. **Comprador se va feliz** con PDF en su email, sales rep tiene lead capturado con unidad específica
7. **Follow-up**: Sales rep revisa `/leads` en dashboard → "Juan visitó 3pm, le interesa 802, envié cotización"

**Tiempo total:** 15 minutos (vs 30-45 minutos buscando archivos, abriendo Excel, revisando disponibilidad)

### Journey 2: Comprador Curioso Explora Solo desde Casa
1. **Discovery**: Comprador ve ad en Facebook (11pm), click → `altodeyeguas.com`
2. **Landing**: Fullscreen hero video, branding, "Ingresar" → exit animation → galería
3. **Exploración autónoma** (8-12 minutos):
   - Galería: Swipes 30 renders (exteriores, interiores, amenidades)
   - Tipologías: Explora plano 2BR → click en sala → fullscreen render
   - Inventario: Filters "2BR + Disponible + Piso 8+" → encuentra 3 units
   - Explorar (Grid): Click unit 802 en fachada → ve corner, west-facing, $450M
4. **Cotización**: Click "Cotizar" → ve plan de pagos → llena email → recibe PDF
5. **Ubicación**: Checks map → proyecto 2km Parque El Virrey → perfecto
6. **WhatsApp**: Click floating button → "Hola, me interesa unit 802..."
7. **Sales Follow-up** (día siguiente): Team responde, referencias PDF quote, schedules viewing

**Tiempo en microsite:** 8-12 minutos (vs 2 min PDF skim)
**Engagement:** 5+ sections, 1 quote, 1 WhatsApp (vs PDF: maybe 1 email)

### Constructora Journey (Admin)
1. **Discovery**: Director Comercial ve ad/demo → "Necesito esto para mi próximo proyecto"
2. **Sign-up**: Crea cuenta → plan Premium ($149/mo)
3. **Onboarding** (Día 1):
   - AI Creator: Sube brochure PDF → IA extrae tipologías, specs, ubicación
   - Preview data → confirma → proyecto creado
4. **Content Population** (Días 2-3):
   - Sube renders, planos, galería (30 fotos)
   - AI Unit Generator: "Torre 15 pisos, 4 units/piso" → 60 units creadas
   - Noddo Grid: Sube fachada → arrastra units → hotspots positioned
   - Cotizador: Define plan de pagos (Separación $5M, Inicial 30%, Contra entrega resto)
5. **Publishing** (Día 4):
   - Custom domain configurado (`altodeyeguas.com`)
   - Click "Publicar" → v1 snapshot → microsite live
6. **Sales & Analytics** (Ongoing):
   - Invite sales agent as collaborator → acceso a `/disponibilidad`
   - Agent marca units (disponible → separado → vendida)
   - Director Comercial checks `/estadisticas`: 450 views, 12 leads, $850M revenue, 2.5 units/month velocity

### Comprador Journey (Buyer)
1. **Discovery**: Ve ad en Facebook → click → llega a `altodeyeguas.com`
2. **Landing**: Fullscreen hero video, branding, "Ingresar" → exit animation → galería
3. **Galería**: Swipes 30 renders (exteriores, interiores, amenidades) → emocionado
4. **Tipologías**: Explora plano 2BR → click en sala → fullscreen render → ve características
5. **Inventario**: Filters "2BR + Disponible + Piso 8+" → encuentra 3 units
6. **Explorar** (Noddo Grid): Click unit 802 en fachada → ve corner, west-facing, $450M → click "Cotizar"
7. **CotizadorModal**: Ve plan de pagos (Separación $10M, 36 cuotas $12M) → llena email → recibe PDF quote instantly
8. **Ubicación**: Checks map → proyecto 2km Parque El Virrey, 5km Unicentro → perfecto
9. **WhatsApp**: Click floating button → "Hola, me interesa unit 802, vi el plan de pagos..."
10. **Sales Follow-up**: Team responde en 2 horas, referencias PDF quote, schedules viewing

**Tiempo en microsite:** 8-12 minutos (vs 2 min PDF skim)
**Engagement:** 5+ sections, 1 quote, 1 WhatsApp (vs PDF: maybe 1 email)

---

## Pricing & Plans

**Basic** ($79/mo):
- 1 proyecto activo, hasta 200 unidades
- Galería + contacto + disponibilidad
- 10GB storage
- ❌ Sin videos, maps, 360° tours

**Premium** ($149/mo) — **Más Popular**:
- 5 proyectos, unidades ilimitadas
- ✅ TODO incluido: Videos, Maps, 360° Tours, Analytics, Custom Domain, Cotizador
- 50GB por proyecto
- Implementación asistida

**Enterprise** ($499+/mo):
- Proyectos ilimitados
- White-label completo (sin "Powered by NODDO")
- API + Webhooks
- Bulk CSV import
- 24/7 support + SLA
- 500GB total

**Implementación asistida incluida en todos los planes** → especialista configura primer proyecto.

---

## Key Metrics & Analytics

### Estadísticas Dashboard (`/estadisticas`)
**Summary KPIs:**
- Total views, unique visitors, leads, conversion rate
- Time series charts (7d/30d/90d): views/visitors over time

**Financial Analytics** (multi-currency: COP/USD/AED/MXN/EUR):
- **Total revenue**: Sum of sold units
- **Available inventory value**: Sum of disponible units
- **Reserved value**: Sum of separado + reservada
- **Sales velocity**: Units/month trend
- **Monthly revenue chart**: Sold units grouped by month
- **Units sold table**: ID, tipología, price, area, sale date

**Breakdown Tables:**
- Views by: page, device, country, referrer
- Leads by: source (UTM), tipología, country

**Email Reports:** Weekly/monthly summaries auto-sent to admin

### Lead Management (`/leads`)
**CRM-style table:**
- Name, email, phone, country, tipología interest, status
- Cotizaciones count (# payment plans requested)
- Status workflow: nuevo → contactado → calificado → cerrado
- Filters: Project, status, date range, search
- Export CSV

---

## Tech Stack (Relevante para Marketing)

### Frontend
- **Next.js 16** with App Router (SSR for SEO, instant updates)
- **Framer Motion** (page transitions, animations) → premium feel
- **Tailwind CSS v4** → consistent dark luxury design
- **Fonts**: Cormorant Garamond (headings), DM Mono (body), Syne (UI labels) → brand differentiation

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Postgres triggers** → real-time inventory tracking
- **Edge functions** → booking automation, email sequences

### Integrations
- **Mapbox GL JS** → interactive satellite maps
- **Cloudflare Stream** → video hosting (Premium+)
- **Resend API** → transactional emails
- **GoHighLevel (GHL)** → CRM integration (marketing leads)
- **Meta CAPI** → conversion tracking for ads

### Performance
- **Lazy-loading**: Images load on-demand (fast initial load)
- **Responsive images**: Supabase Storage auto-resizes
- **CDN**: Global edge caching via Vercel

---

## Competitive Positioning

### NODDO vs Competitors

| Competitor Type | Strengths | Weaknesses | NODDO Advantage |
|----------------|-----------|------------|-----------------|
| **PDF Brochures** | Free, familiar | Static, sales rep busca archivo en laptop durante presentación, no tracking, outdated availability | Interactive, sales rep abre UN link en tablet (todo ahí), real-time, tracked, 24/7 |
| **PowerPoint Presentations** | Sales rep controla flow | Requires prep time, desactualizado, no genera cotizaciones, comprador no puede explorar solo | Sales rep Y comprador pueden usar, cotizaciones en vivo, disponibilidad siempre actualizada |
| **Custom Agency Sites** | Fully custom design | $25k-$100k, 3-6 months, maintenance costs | 50x cheaper, 30x faster, self-service |
| **3D Software (Matterport)** | Immersive VR | Requires physical building (no pre-sales), no CRM, expensive scans, sales rep NO puede generar cotizaciones | Works with renders (pre-construction), integrated leads + inventory + cotizador en vivo |
| **Generic Website Builders (Wix/Squarespace)** | Cheap, easy templates | No real estate-specific features, no inventory management, no Grid, no cotizador | Purpose-built for real estate, Grid + inventory + cotizador para sales reps |
| **Real Estate Portals (Fincaraíz/Properati)** | High traffic, discovery | Listings only, no branded experience, no inventory control, sales rep NO puede presentar ahí | Owned microsite, full control, branded, sales rep usa en tablet |

**Key Differentiator:** NODDO is the ONLY platform that combines:
1. Interactive facade/floor plan visualization (Grid)
2. Real-time inventory management with audit trail
3. Integrated payment calculator + instant PDF quotes
4. Lead capture with behavioral context + UTM attribution
5. All in a premium, white-labeled microsite

---

## Messaging Framework

### Elevator Pitch (30 sec)
"NODDO es la plataforma que convierte tus renders en una sala de ventas interactiva 24/7. Funciona en DOS escenarios: (1) Tu sales rep abre un link en tablet → TODO está ahí (inventario, cotizador, disponibilidad real-time), cierra venta en 15 minutos vs 45 buscando archivos. (2) Comprador explora solo desde casa a las 11pm, genera cotización, tú capturas lead mientras duermes. Publicado en 1 día, no en 6 meses. Desde $149/mes, no $60k con agencia."

### Value Props por Buyer Persona

**Director Comercial** (cares about: leads, conversion, sales velocity):
- "Capta 2.4x más leads calificados — cada lead llega con unidad de interés + fuente + comportamiento"
- "Tu equipo vende 3x más porque no pierde tiempo buscando archivos — todo en un link, siempre actualizado"
- "Sales reps cierran en 15 minutos vs 45 minutos — cotizaciones generadas en vivo, sin buscar Excel"
- "Sala de ventas 24/7 — compradores exploran a las 11pm, leads llegan mientras duermes"
- "Disponibilidad en tiempo real previene el 'ay no, esa se vendió ayer' — zero double-booking"

**Gerente General / Junta** (cares about: ROI, cost savings):
- "De $60k con agencia a $1.8k/año — mismo resultado, 50x menos costo"
- "Lanza preventa en 1 día vs. 6 meses — cada mes antes son 18-24 unidades extra vendidas"
- "Dashboard con revenue real-time, sales velocity, inventory value — visibilidad total"

**VP de Proyectos** (cares about: scalability, efficiency):
- "Maneja 5 proyectos desde un solo dashboard — no necesitas agencia para cada uno"
- "Invita colaboradores (sales team) con acceso limitado — solo disponibilidad, sin tocar contenido"
- "Versión history con rollback — publica cambios sin miedo a romper algo"

### Objections & Rebuttals

**"Ya trabajamos con una agencia"**
→ "Perfecto. NODDO no reemplaza tu agencia — reemplaza los PDFs, Excel y WhatsApps que te hacen perder 47% de leads. Tu agencia sigue creando renders, nosotros los convertimos en sala de ventas interactiva."

**"Mi proyecto es único, esto no funcionará"**
→ "Clientes manejan desde 40 hasta 450 unidades. VIS, VIP, mixtos. El Grid se adapta a TU proyecto — subir tu fachada + colocar units. Si tienes renders, funciona."

**"No soy tech, esto se ve complicado"**
→ "Si sabes usar Google Drive, sabes usar NODDO. Setup completo: 1 día con implementación asistida (incluida en tu plan). Nosotros te ayudamos a configurar el primer proyecto."

**"¿Qué pasa si no funciona?"**
→ "Prueba 14 días gratis. Si NODDO no te genera al menos 2x más leads calificados que tu método actual, te devolvemos el 100%. Sin preguntas."

---

## Marketing Channels & Attribution

### Lead Sources (UTM Tracking)
- **Facebook/Instagram Ads** → `utm_source=facebook`, `utm_medium=paid`, `utm_campaign=alto-yeguas-launch`
- **Google Search** → `utm_source=google`, `utm_medium=organic`
- **WhatsApp campaigns** → `utm_source=whatsapp`, `utm_campaign=blast-feb`
- **Email newsletters** → `utm_source=email`, `utm_medium=newsletter`

### Conversion Funnel
1. **Ad click** → Landing page (hero + value props)
2. **Explore microsite** → Galería, Tipologías, Explorar (Grid)
3. **Unit interest** → Click unit → Cotizar
4. **Lead capture** → Form submit OR WhatsApp click
5. **Sales follow-up** → Team calls within 24h (context: "Vi que exploraste unit 802...")

**Analytics tracking:**
- `page_view` on every route change
- `cta_clicked` on form submits, WhatsApp clicks
- `video_play`, `tour_360_view`, `recurso_download`
- All events include: user_id (anonymous), proyecto_id, timestamp, UTM params, device, country

---

## Success Metrics (What to Measure)

### Platform-Level KPIs
1. **Projects published** — Growth rate (monthly)
2. **Active users** — Constructoras with ≥1 published project
3. **Revenue** — MRR, ARR, plan distribution (Basic/Premium/Enterprise)
4. **Churn** — % of users canceling per month

### Project-Level KPIs (Per Constructora)
1. **Conversion rate** — Views → Leads (benchmark: 2-5%)
2. **Lead quality** — % of leads with tipología interest filled
3. **Sales velocity** — Units sold per month (auto-calculated from state history)
4. **Engagement** — Avg time on site, pages per session

### Marketing Campaign KPIs
1. **Landing → Form submit** — Conversion rate by UTM source
2. **Form submit → Booking** — Qualification rate
3. **Booking → Show** — Show rate for demos
4. **Demo → Customer** — Close rate

**Target benchmarks (based on SaaS B2B):**
- Landing → Form: 3-8%
- Form → Booking: 15-30%
- Booking → Show: 60-80%
- Demo → Customer: 20-40%

---

## Brand Voice & Tone

### Voice Attributes
- **Profesional pero cercano** — No corporativo frío, no startup infantil
- **Confiado sin arrogancia** — "Sabemos que funciona" (social proof), no "somos los mejores"
- **Educativo** — Explica el "por qué", no solo el "qué"
- **Cuantificado** — Usa números específicos ("2.4x más leads"), no vagos ("más leads")

### Vocabulary Patterns
- **Active voice** — "El Grid se actualiza" (no "es actualizado")
- **Buyer empathy** — "El comprador ya no pide — la busca"
- **Efficiency language** — "Sin código, sin agencia, sin fricción"
- **Italics for emotion** — *como lo que es*, *venden diferente*, *la busca*

### Example Copy (Hero)
"Tu proyecto merece más que un brochure. El comprador ya no pide información — *la busca*. Dale un showroom que responda solo: inventario en vivo, planos, recorridos 360° y leads cualificados. Listo en 3 días, sin código."

**Tone:** Aspirational (merece más), urgency (ya no pide), solution-focused (showroom que responde solo), proof (3 días), no-barrier (sin código).

---

## Next Steps for Marketing

### Content to Create
1. **Case studies** — "Cómo Torre Candelaria vendió 22 unidades en 30 días con NODDO"
2. **Comparison guides** — "NODDO vs PDF vs Agencia" (table format)
3. **Calculator tool** — "Calcula cuánto pierdes sin showroom digital" (lead magnet)
4. **Video demos** — 2-minute walkthrough of Grid + Cotizador
5. **Blog posts** — "Cómo calcular el ROI de tu marketing inmobiliario", "15 elementos que todo showroom digital debe tener"

### Campaigns to Run
1. **Facebook/Instagram Ads** → Target: Constructoras en Colombia (lookalike from existing customers)
2. **Google Search** → Keywords: "showroom digital inmobiliario", "micrositios para proyectos", "plataforma preventa"
3. **WhatsApp campaigns** → Direct outreach to constructora directors
4. **Email sequences** → 6-email pre-demo nurture (beliefs, objections, case studies)
5. **Retargeting** → Visitors who viewed pricing but didn't convert

### A/B Tests to Run
1. **Hero headline** — Loss-framed ("¿Cuántos compradores perdiste?") vs Gain-framed ("Capta 2.4x más leads")
2. **Pricing page** — Risk reversal ("Prueba 14 días gratis") vs No risk reversal
3. **ContactForm** — 7 fields vs 3 fields (name, email, plan)
4. **Email E3** — Subject: "No tengo tiempo" vs "3 objeciones que todos dicen"
5. **CTA copy** — "Agendar Demo" vs "Ver cómo funciona (2 min)"

---

## Conclusión

NODDO NO es un website builder. Es un **sistema de ventas digitales para pre-construcción inmobiliaria** que reemplaza brochures PDF, Excel sheets, generic forms y separate analytics con una plataforma integrada optimizada para **velocidad** (1 día vs 6 meses), **costo** ($1.8k/año vs $60k) y **conversión** (2.4x más leads calificados).

**La propuesta de valor central:**
Convierte renders arquitectónicos (que constructoras YA tienen) en sala de ventas interactiva 24/7 donde compradores exploran solos, se auto-califican y generan leads contextualizados — mientras constructoras tienen visibilidad completa (revenue real-time, sales velocity, inventory value).

**El diferenciador único:**
Noddo Grid (clickable facade + floor plans con real-time availability overlay) + Cotizador integrado + Lead capture con contexto comportamental — todo en un microsite white-labeled con custom domain.

**Para quién:**
Constructoras en Latinoamérica (Colombia, México, Perú) que venden proyectos en pre-venta (40-450 unidades) y necesitan convertir tráfico digital en leads calificados sin gastar $60k en agencias custom.