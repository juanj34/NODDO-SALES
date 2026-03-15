# NODDO - Documentación Completa del Producto
## Technical + Business + Marketing Reference

**Última actualización:** 15 Marzo 2026
**Versión:** 2.0
**Tipo:** SaaS Platform - Premium Real Estate Microsites

---

## ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Problema & Mercado](#problema--mercado)
3. [Solución - NODDO](#solución---noddo)
4. [Arquitectura Técnica](#arquitectura-técnica)
5. [Características & Funcionalidades](#características--funcionalidades)
6. [Stack Tecnológico Enterprise](#stack-tecnológico-enterprise)
7. [Seguridad & Compliance](#seguridad--compliance)
8. [Base de Datos & Schema](#base-de-datos--schema)
9. [Dashboard de Administración](#dashboard-de-administración)
10. [Microsites Públicos](#microsites-públicos)
11. [Sistema de Diseño](#sistema-de-diseño)
12. [Performance & Optimización](#performance--optimización)
13. [Infraestructura & DevOps](#infraestructura--devops)
14. [Analytics & Tracking](#analytics--tracking)
15. [Integraciones](#integraciones)
16. [Modelo de Negocio](#modelo-de-negocio)
17. [Roadmap & Visión](#roadmap--visión)
18. [Casos de Uso](#casos-de-uso)
19. [Ventajas Competitivas](#ventajas-competitivas)
20. [FAQ Técnicas](#faq-técnicas)

---

## RESUMEN EJECUTIVO

### ¿Qué es NODDO?

**NODDO** es una plataforma SaaS enterprise que permite a desarrolladoras inmobiliarias en América Latina crear, gestionar y publicar **microsites premium** para sus proyectos residenciales en menos de 48 horas, sin necesidad de equipo técnico.

### Propuesta de Valor

**Para desarrolladoras inmobiliarias:**
- ❌ **Sin NODDO:** Pagan $50,000 a agencias, esperan 6 meses, obtienen sitios genéricos con 1-2% conversión
- ✅ **Con NODDO:** $299/mes, live en 48h, diseño dark luxury único, 8% conversión promedio

### Métricas Clave (Marzo 2026)

- 🏗️ **150+ proyectos** activos en plataforma
- 📊 **2,450 leads** capturados en Q1 2026
- ⚡ **0.8s** tiempo promedio de carga
- 📈 **8.2%** tasa de conversión promedio (vs 1.5% industria)
- 🌎 **3 países** activos: Colombia, México, Chile
- 💰 **$45K MRR** (Monthly Recurring Revenue)

### Diferenciadores vs. Competencia

| Característica | Agencia Custom | Wix/WordPress | NODDO |
|---|---|---|---|
| Tiempo de deploy | 6 meses | 2 semanas | 48 horas |
| Costo inicial | $50,000 | $0 | $0 |
| Costo mensual | N/A | $500 | $299 |
| Diseño premium único | ✅ | ❌ | ✅ |
| Sin código | ❌ | ⚠️ | ✅ |
| CRM integrado | ❌ | ❌ | ✅ |
| Analytics real-time | ❌ | ⚠️ | ✅ |
| Soporte 24/7 español | ❌ | ❌ | ✅ |
| Performance <1s | ⚠️ | ❌ | ✅ |

---

## PROBLEMA & MERCADO

### El Problema

**Desarrolladoras inmobiliarias en LATAM enfrentan:**

1. **Sitios web genéricos** que no transmiten lujo ni exclusividad
2. **Baja conversión** (1-2%) de visitantes a leads
3. **Costos prohibitivos** de agencias custom ($50K+ por sitio)
4. **Tiempos largos** (6+ meses para tener sitio live)
5. **Dependencia técnica** (requieren developers para cada cambio)
6. **Falta de herramientas** para gestionar inventario y leads

### Tamaño del Mercado (TAM/SAM/SOM)

**TAM (Total Addressable Market):**
- América Latina: ~8,500 desarrolladoras inmobiliarias activas
- Promedio 3 proyectos/año por desarrolladora
- **TAM = 25,500 proyectos/año × $299/mes × 12 = $91M USD/año**

**SAM (Serviceable Addressable Market):**
- Colombia + México + Chile: ~2,800 desarrolladoras
- **SAM = 8,400 proyectos/año × $299/mes × 12 = $30M USD/año**

**SOM (Serviceable Obtainable Market - 3 años):**
- Meta 5% market share en 3 países core
- **SOM = 420 proyectos activos × $299/mes × 12 = $1.5M USD/año**

### Buyer Persona

**María González - Directora Comercial**
- 38 años
- Desarrolladora mediana (50-200 unidades/proyecto)
- Pain: Sitio actual convierte <2%, se ve anticuado
- Goal: Vender 80% de unidades en preventa
- Budget: $500-1,000/mes en marketing digital
- Decision criteria: ROI rápido, fácil de usar, soporte en español

---

## SOLUCIÓN - NODDO

### Core Value Proposition

**"La experiencia digital premium que proyectos de $10M merecen - en 48 horas, sin equipo técnico"**

### Cómo Funciona (User Journey)

#### 1. Onboarding (Día 0)
- Cliente completa formulario con info del proyecto
- Sube assets: renders, planos, logo, colores de marca
- NODDO team hace setup inicial

#### 2. Customización (Día 1-2)
- Cliente accede a dashboard
- Personaliza contenido via editor WYSIWYG:
  - Tipologías (apartamentos, casas)
  - Galería por categorías
  - Videos
  - Puntos de interés en mapa
  - Brochure PDF
  - Tour 360 (Matterport)
- Preview en tiempo real

#### 3. Publicación (Día 2)
- Cliente publica con 1 clic
- Microsite live en `proyecto.noddo.io` o dominio custom
- SEO optimizado automáticamente

#### 4. Gestión Continua
- Dashboard para:
  - Ver leads en tiempo real
  - Analítica (visitors, CTR, bounce rate)
  - Editar contenido sin republish
  - Exportar leads a CSV
  - Integrar con CRM externo via webhook

### Componentes Principales

```
NODDO Platform
│
├── 1. Microsites Públicos (Frontend)
│   ├── Diseño dark luxury personalizable
│   ├── 8 páginas core (Landing, Tipologías, Galería, etc.)
│   ├── Optimización mobile-first
│   └── Performance <1s load
│
├── 2. Dashboard Admin (Backend)
│   ├── Gestión de proyectos
│   ├── Editor de contenido (0 código)
│   ├── CRM de leads
│   ├── Analytics & reportes
│   └── Configuración de branding
│
└── 3. Infraestructura Enterprise
    ├── PostgreSQL (Supabase)
    ├── Auth & RBAC
    ├── CDN global (Vercel Edge)
    ├── Object storage (imágenes, PDFs)
    └── Monitoring & alertas
```

---

## ARQUITECTURA TÉCNICA

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USUARIO FINAL                        │
│              (Comprador de apartamento)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               MICROSITE PÚBLICO                          │
│         proyecto.noddo.io / custom domain                │
│                                                          │
│  • Next.js 16 App Router (SSR + Client)                 │
│  • Framer Motion animations                             │
│  • Mapbox GL JS (satellite maps)                        │
│  • Responsive mobile-first                              │
│  • Dark luxury design system                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  VERCEL EDGE CDN                         │
│  • Global edge network (latencia <50ms)                 │
│  • Smart caching (stale-while-revalidate)               │
│  • Image optimization (WebP, AVIF)                      │
│  • DDoS protection                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API ROUTES (Next.js)                        │
│                                                          │
│  /api/proyectos     → CRUD proyectos                    │
│  /api/tipologias    → CRUD tipologías                   │
│  /api/galeria       → CRUD imágenes                     │
│  /api/leads         → POST lead, GET leads              │
│  /api/upload        → Upload imágenes a Supabase        │
│  /api/analytics     → Track events                      │
│  /api/auth/*        → Supabase Auth callback            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          SUPABASE (Backend-as-a-Service)                 │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │   PostgreSQL Database (Primary)            │         │
│  │   • proyectos, tipologias, galeria, leads  │         │
│  │   • Row Level Security (RLS)               │         │
│  │   • Realtime subscriptions                 │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │   Auth Service                             │         │
│  │   • Email/password                         │         │
│  │   • OAuth (Google)                         │         │
│  │   • JWT tokens                             │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │   Storage                                  │         │
│  │   • Bucket: renders, planos, galeria       │         │
│  │   • CDN-backed                             │         │
│  │   • Auto image optimization                │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              SERVICIOS EXTERNOS                          │
│                                                          │
│  • Mapbox API (mapas satelitales)                       │
│  • Sentry (error tracking)                              │
│  • Upstash Redis (rate limiting, caching)               │
│  • Vercel Analytics                                      │
│  • Resend (transactional emails)                        │
└─────────────────────────────────────────────────────────┘
```

### Request Flow (Ejemplo: Usuario visita microsite)

```
1. Usuario → https://torres-del-sol.noddo.io

2. DNS → Vercel Edge CDN (más cercano geográficamente)

3. Vercel Edge:
   - Cachea página estática (HTML)
   - Si cache hit → devuelve inmediatamente (10-50ms)
   - Si cache miss → forward a Next.js server

4. Next.js Server (SSR):
   - Layout lee proyectoId del slug "torres-del-sol"
   - Query Supabase: SELECT * FROM proyectos WHERE slug = 'torres-del-sol'
   - Server rendering con datos frescos
   - Devuelve HTML + data en props

5. Client Hydration:
   - React hydrate en browser
   - Framer Motion inicia animaciones
   - Mapbox API carga mapa satelital
   - Lazy load imágenes below fold

6. Usuario interactúa (ej. abre galería):
   - Client-side routing (sin full reload)
   - Query Supabase desde client para imágenes
   - Lightbox abre con Framer Motion

7. Usuario llena formulario de contacto:
   - POST /api/leads con datos + UTM params
   - API valida, sanitiza, inserta en DB
   - Email transaccional via Resend
   - WhatsApp notification (futuro)
```

---

## CARACTERÍSTICAS & FUNCIONALIDADES

### 1. Microsites Públicos

#### Páginas Core (8 páginas por proyecto)

##### 1.1. Landing Page (`/`)
**Descripción:** Hero fullscreen con imagen de fachada, overlay gradiente cálido, CTA destacado

**Elementos:**
- Hero image (render fachada proyecto)
- Título proyecto + tagline
- Ubicación (ciudad, barrio)
- CTA primario: "Conoce más" / "Agenda visita"
- WhatsApp floating button (sticky)
- Scroll indicator (animated)

**Tech:**
- Image optimization (next/image, WebP/AVIF)
- Gradient overlay customizable (brand colors)
- Framer Motion entrance animations

##### 1.2. Tipologías (`/tipologias`)
**Descripción:** Showcase de tipos de unidades (1br, 2br, 3br, penthouses)

**Elementos:**
- Slider fullscreen con renders interiores
- Specs técnicas:
  - Área (m²)
  - Habitaciones / baños
  - Pisos disponibles
  - Precio desde (opcional)
- Planos arquitectónicos (popup)
- Navegación:
  - Arrows (prev/next)
  - Thumbnails strip
  - Type selector (tabs)

**Tech:**
- Framer Motion AnimatePresence para transiciones
- Lazy load de imágenes no visibles
- Touch gestures (swipe mobile)

##### 1.3. Galería (`/galeria`)
**Descripción:** Galería categorizada HD con lightbox

**Elementos:**
- Tabs por categoría:
  - Exteriores
  - Zonas comunes
  - Acabados
  - Ubicación
  - Avance de obra
- Horizontal scroll slider por categoría
- Lightbox fullscreen:
  - Zoom
  - Prev/next
  - Thumbnail strip
  - Keyboard navigation (arrows, escape)

**Tech:**
- Lazy load agresivo (solo 6 primeras imágenes)
- WebP + srcset responsive
- CSS backdrop-filter (glassmorphism)

##### 1.4. Ubicación (`/ubicacion`)
**Descripción:** Mapa satelital interactivo con POIs

**Elementos:**
- Mapbox GL fullscreen satellite view
- Marker dorado (proyecto) con pulse animation
- POI markers (colegios, parques, transporte, centros comerciales)
- Panel lateral glassmorphism con detalles POI:
  - Imagen
  - Nombre + ciudad
  - Distancia (km)
  - Tiempo en auto/caminando
  - Descripción breve
- Prev/Next navigation entre POIs
- FlyTo animation al seleccionar POI

**Tech:**
- Mapbox GL JS (no Google Maps - mejor satelital)
- Custom markers (Canvas-rendered)
- Lazy load markers (solo visible viewport)

##### 1.5. Videos (`/videos`)
**Descripción:** Embeds de YouTube con lista lateral

**Elementos:**
- Video principal (YouTube embed)
- Sidebar con lista de videos:
  - Thumbnail
  - Título
  - Duración
- Click para cambiar video (sin reload)

**Tech:**
- YouTube IFrame API
- Lazy load embed (solo cuando visible)
- Autoplay en mobile (muted)

##### 1.6. Contacto (`/contacto`)
**Descripción:** Formulario de contacto con captura de UTM

**Elementos:**
- Background blur (project hero image)
- Glass card form:
  - Nombre completo
  - Email
  - Teléfono (validación formato LATAM)
  - Mensaje (opcional)
  - Interés en: [dropdown - tipologías]
  - Checkbox GDPR consent
- CTA: "Enviar solicitud"
- Confirmation toast

**Tech:**
- POST /api/leads
- Automatic UTM capture (source, medium, campaign)
- Honeypot anti-spam
- Rate limiting (max 5 submissions/IP/hour)
- Email notification via Resend
- Lead stored in Supabase CRM

##### 1.7. Brochure (`/brochure`)
**Descripción:** PDF viewer embebido

**Elementos:**
- PDF.js embed fullscreen
- Download button
- Zoom controls
- Mobile: direct download (no embed)

**Tech:**
- PDF stored in Supabase Storage
- Signed URLs (expiran en 1h)
- Track download event in analytics

##### 1.8. Tour 360 (`/tour`)
**Descripción:** Matterport 3D tour embed

**Elementos:**
- Matterport iframe fullscreen
- Fallback: mensaje si no disponible

**Tech:**
- Matterport embed SDK
- Lazy load (solo cuando user visita página)

---

#### Características Cross-Page

##### Navegación
- **Header sticky:**
  - Logo proyecto
  - Nav links (desktop)
  - Hamburger menu (mobile)
  - Glassmorphism bg
- **Mobile menu:**
  - Slide-in from right
  - Framer Motion animation
  - Overlay backdrop

##### WhatsApp Integration
- **Floating button:**
  - Sticky bottom-right
  - Pulse animation
  - Número de contacto del proyecto
  - Pre-filled message: "Hola, estoy interesado en [Proyecto]"

##### Orientation Lock (Mobile)
- **Portrait warning:**
  - Overlay cuando mobile en portrait
  - "Gira tu dispositivo para mejor experiencia"
  - Landscape-first design

##### Footer
- **Glassmorphism footer:**
  - Logo desarrolladora
  - Links legales (Privacidad, Términos)
  - Social media icons
  - "Powered by NODDO" badge
  - Copyright

---

### 2. Dashboard de Administración

#### 2.1. Autenticación & Roles

##### Login (`/login`)
- Email/password via Supabase Auth
- Google OAuth (1-click)
- "Forgot password" flow
- Auto-redirect a `/dashboard` si ya autenticado

##### Roles

| Role | Permisos |
|---|---|
| **Admin** | Full access - CRUD proyectos, tipologías, galería, leads, settings |
| **Collaborator** | Solo puede cambiar `unidades.estado` (disponible/reservada/vendida) |
| **Viewer** | Solo lectura - analytics, leads (futuro) |

##### RBAC Implementation
- Row Level Security (RLS) en Supabase
- Middleware protege rutas `/dashboard/*`
- `getAuthContext()` helper en API routes

---

#### 2.2. Dashboard Home (`/dashboard`)

**Layout:**
- Sidebar izquierda (sticky)
- Content area principal

**KPI Strip (top):**
- Total proyectos activos
- Total leads (mes actual)
- Tasa conversión promedio
- Visitantes únicos (mes actual)

**Sections:**

##### Enhanced Shortcuts
- Grid 2 columnas
- 6 shortcuts principales:
  - 📊 Crear Nuevo Proyecto
  - 🏗️ Ver Proyectos
  - 📧 Gestionar Leads
  - 📈 Ver Analytics
  - ⚙️ Configuración
  - 🎨 Editor de Proyecto

**Design:**
- Card glassmorphism
- Icon 64px con gold background
- Hover: lift + glow animation
- Descripción breve (1 línea)

##### Recent Projects Preview
- 3 proyectos más recientes
- Card por proyecto:
  - Thumbnail
  - Nombre + ubicación
  - Status badge (Publicado/Borrador)
  - Quick actions: Editar, Ver microsite, Analytics
- "Ver todos" CTA → `/proyectos`

##### Recent Activity Feed (sidebar right)
- Últimas 10 acciones:
  - "Nuevo lead: María González (Torres del Sol)"
  - "Proyecto publicado: Bosque Verde"
  - "Imagen agregada a galería: Fachada norte"
- Real-time via Supabase subscriptions

---

#### 2.3. Proyectos Table (`/proyectos`)

**Descripción:** Tabla searchable/sortable de todos los proyectos

**Features:**

##### Filters Bar
- **Search:** Buscar por nombre/slug
- **Status chips:**
  - Todos
  - Publicado (pulse animation green)
  - Borrador
  - Archivado
- **Sort dropdown:**
  - Más reciente
  - Más antiguo
  - A-Z
  - Z-A
  - Más leads
  - Mejor conversión

##### Table Columns
- **Thumbnail** (cover image)
- **Nombre** (link to editor)
- **Slug** (subdomain)
- **Ubicación** (ciudad, país)
- **Status** badge
- **Leads** (count + trend icon)
- **Conversión** (%)
- **Última edición** (relative time)
- **Actions:**
  - ✏️ Editar
  - 📊 Analytics
  - 🌐 Ver microsite (new tab)
  - 🗑️ Eliminar

##### Row Selection
- Checkbox per row
- Bulk actions:
  - Publicar
  - Archivar
  - Eliminar

##### Keyboard Navigation
- `j/k` - next/prev row
- `Enter` - open editor
- `/` - focus search

##### Empty State
- Cuando no hay proyectos:
  - Ilustración
  - "Aún no tienes proyectos"
  - CTA: "Crear tu primer proyecto"

---

#### 2.4. Editor de Proyecto (`/editor/[id]`)

**Layout:**
- Tab navigation (horizontal)
- Content area
- Preview button (top-right): "Vista previa microsite"

**Tabs:**

##### Tab 1: General
**Campos:**
- Nombre proyecto
- Slug (auto-generate desde nombre, editable)
- Descripción breve (tagline)
- Ubicación:
  - País (dropdown)
  - Ciudad
  - Barrio/zona
  - Dirección completa
  - Coordenadas (lat, lng) - auto desde Mapbox Geocoding
- Branding:
  - Color primario (color picker → `--site-primary`)
  - Logo proyecto (upload)
  - Favicon (upload)
- Contacto:
  - WhatsApp (con validación formato)
  - Email
  - Teléfono oficina
- SEO:
  - Meta title (auto-populate desde nombre)
  - Meta description
  - OG image (upload)

**Actions:**
- Guardar borrador
- Publicar
- Archivar

##### Tab 2: Tipologías
**Descripción:** CRUD de tipos de unidades

**Lista de tipologías:**
- Card por tipología:
  - Thumbnail (render interior)
  - Nombre (ej. "2 Habitaciones")
  - Área (m²)
  - Habitaciones / Baños
  - Pisos disponibles
  - Precio desde
  - Actions: Editar, Eliminar
- **+ Agregar tipología** button

**Modal "Agregar/Editar Tipología":**
- Nombre
- Área (m²)
- Habitaciones (number input)
- Baños (number input)
- Precio desde (opcional, currency input)
- Descripción (rich text editor)
- Renders (multi-upload):
  - Drag & drop
  - Preview grid
  - Reorder (drag)
  - Delete
- Planos arquitectónicos (multi-upload PDF/image)

##### Tab 3: Galería
**Descripción:** Gestión de categorías + imágenes

**Structure:**
```
Categorías (Tabs)
├── Exteriores
│   └── [imágenes...]
├── Zonas Comunes
│   └── [imágenes...]
├── Acabados
│   └── [imágenes...]
└── + Crear Categoría
```

**Por cada categoría:**
- Grid de imágenes (masonry layout)
- Drag & drop para reordenar
- Hover: actions (Delete, Set as cover)
- **+ Subir imágenes** button (multi-upload)

**Upload flow:**
- Drag & drop zone
- Progress bar per image
- Auto-optimize (resize, WebP conversion) en Supabase Storage
- Validación: max 10MB per image, formatos jpg/png/webp

##### Tab 4: Videos
**Descripción:** Lista de videos YouTube

**Lista:**
- Card per video:
  - YouTube thumbnail
  - Título
  - Duración (auto-fetch desde YouTube API)
  - Actions: Editar, Eliminar
- **+ Agregar video** button

**Modal "Agregar Video":**
- YouTube URL (paste)
- Auto-extract video ID
- Preview embed
- Título (auto-populate desde YouTube metadata, editable)

##### Tab 5: Ubicación
**Descripción:** POIs (Puntos de Interés)

**Mapa preview:**
- Mapbox embed (read-only)
- Muestra proyecto marker + POI markers

**Lista POIs:**
- Table:
  - Icono categoría
  - Nombre
  - Categoría (Educación, Transporte, Comercio, etc.)
  - Distancia (km - auto-calculada)
  - Actions: Editar, Eliminar
- **+ Agregar POI** button

**Modal "Agregar POI":**
- Nombre
- Categoría (dropdown)
- Coordenadas (lat, lng):
  - Input manual OR
  - Click en mapa
- Distancia (auto-calculada desde proyecto coords)
- Tiempo en auto (manual input)
- Tiempo caminando (manual input)
- Descripción breve
- Imagen (upload)

##### Tab 6: Brochure & Tour 360
**Descripción:** Upload assets

**Brochure PDF:**
- Upload zone
- Current PDF preview (si existe)
- Replace/Delete actions

**Tour 360:**
- Matterport URL input
- Preview embed

##### Tab 7: Configuración Avanzada
**Descripción:** Settings técnicas

**Fields:**
- Custom domain:
  - Input custom domain (ej. `proyecto.desarrolladora.com`)
  - DNS instructions
  - Verify button
- Analytics:
  - Google Analytics ID (optional)
  - Facebook Pixel ID (optional)
- Scripts custom:
  - Header scripts (ej. tracking tags)
  - Footer scripts
- Footer legal links:
  - Política de privacidad URL
  - Términos y condiciones URL
- Status:
  - Publicado / Borrador toggle
  - Fecha publicación (auto)
  - Última edición (auto)

---

#### 2.5. Leads CRM (`/leads`)

**Descripción:** Gestión de leads capturados

**Filters:**
- Search (por nombre, email, teléfono)
- Proyecto (dropdown multi-select)
- Fecha (range picker)
- Fuente UTM (organic, paid, social, etc.)
- Estado (Nuevo, Contactado, Calificado, Perdido, Convertido)

**Table Columns:**
- Fecha/hora
- Nombre
- Email
- Teléfono
- Proyecto
- Interés en (tipología)
- Fuente UTM
- Estado (dropdown editable)
- Mensaje
- Actions: Ver detalles, Marcar como contactado, Exportar

**Bulk Actions:**
- Exportar a CSV
- Marcar como contactado
- Asignar a vendedor (futuro)

**Lead Detail Modal:**
- Info completa lead
- Timeline:
  - Fecha captura
  - Cambios de estado
  - Notas internas
- **+ Agregar nota** (CRM interno)

---

#### 2.6. Analytics (`/analytics`)

**Descripción:** Dashboards de métricas

**Global Overview:**
- KPIs (cards):
  - Total visitantes (mes actual vs. anterior)
  - Total leads (mes actual vs. anterior)
  - Tasa conversión promedio
  - Bounce rate
  - Tiempo promedio en sitio
  - Páginas por sesión

**Charts:**

##### 1. Tráfico Over Time
- Line chart (últimos 30 días)
- Visitantes únicos por día
- Filtro: 7d / 30d / 90d

##### 2. Leads Over Time
- Line chart (últimos 30 días)
- Leads capturados por día

##### 3. Top Proyectos (Tráfico)
- Bar chart horizontal
- Top 10 proyectos por visitantes

##### 4. Top Proyectos (Conversión)
- Bar chart horizontal
- Top 10 proyectos por tasa conversión

##### 5. Traffic Sources
- Pie chart
- Organic / Direct / Paid / Social / Referral

##### 6. Device Breakdown
- Donut chart
- Desktop / Mobile / Tablet

##### 7. Top Landing Pages
- Table
- Página, Visitantes, Bounce rate

##### 8. Search Patterns (NEW - Marzo 2026)
- Heatmap de búsquedas internas (si hay search en microsite)
- Keywords más buscados

**Export:**
- Exportar reporte PDF (último mes)
- Programar reporte mensual automático (email)

---

#### 2.7. Configuración de Cuenta (`/settings`)

**Tabs:**

##### Perfil
- Nombre
- Email
- Avatar (upload)
- Cambiar contraseña

##### Desarrolladora/Empresa
- Nombre empresa
- Logo empresa
- Sitio web
- Teléfono
- Dirección

##### Equipo (futuro)
- Invitar colaboradores
- Roles & permisos
- Lista de usuarios activos

##### Facturación
- Plan actual (Starter / Pro / Enterprise)
- Método de pago
- Historial de facturas
- Upgrade/Downgrade plan

##### Notificaciones
- Email cuando nuevo lead
- Email reporte semanal
- WhatsApp notifications (futuro)

---

## STACK TECNOLÓGICO ENTERPRISE

### Frontend

#### Next.js 16
**Por qué:**
- App Router (mejores patterns SSR/CSR)
- React Server Components (menos JS al cliente)
- Turbopack (builds 10x más rápidos que Webpack)
- Automatic code splitting
- Built-in Image optimization

**Configuración clave:**
```javascript
// next.config.mjs
export default {
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['supabase.co', 'unsplash.com'],
    minimumCacheTTL: 2592000, // 30 días
  },
  experimental: {
    turbo: true,
  },
}
```

#### React 19
**Features usadas:**
- Server Components (reduce bundle size)
- Suspense boundaries (loading states)
- useOptimistic (optimistic UI updates)

#### TypeScript (Strict Mode)
**Rules:**
- `strict: true`
- No `any` permitido
- All props typed con interfaces
- Path aliases: `@/components`, `@/lib`, etc.

#### Tailwind CSS v4
**Por qué v4:**
- CSS variables nativas (no más JIT compiler)
- Faster build times
- Better DX con autocomplete

**Configuración custom:**
```css
/* globals.css */
:root {
  --site-primary: #D4A574;  /* Customizable per proyecto */
  --site-primary-rgb: 212, 165, 116;

  /* Surface system */
  --surface-0: #0A0A0B;
  --surface-1: #111113;
  /* ... */
}
```

#### Framer Motion
**Casos de uso:**
- Page transitions
- Scroll-driven animations
- Lightbox enter/exit
- Micro-interactions (hover, tap)

**Performance:**
- GPU-accelerated transforms
- `will-change` hints
- Exit animations con AnimatePresence

---

### Backend

#### Supabase (Backend-as-a-Service)

**Componentes usados:**

##### 1. PostgreSQL Database
- **Version:** 15.x
- **Features:**
  - JSONB columns (branding config)
  - Full-text search (búsqueda proyectos)
  - Triggers (auto-update timestamps)
  - Indexes (slug, user_id para fast queries)

##### 2. Supabase Auth
- **Providers:**
  - Email/Password (bcrypt hashing)
  - Google OAuth
- **JWT tokens** (auto-refresh)
- **Row Level Security (RLS):**
  - Users solo ven sus propios proyectos
  - Collaborators tienen permisos limitados

##### 3. Supabase Storage
- **Buckets:**
  - `renders` - Renders de tipologías
  - `galeria` - Imágenes de galería
  - `brochures` - PDFs
  - `logos` - Logos de proyectos
- **Features:**
  - CDN-backed (fast delivery)
  - Signed URLs (seguridad)
  - Auto image optimization (resize, format)

##### 4. Supabase Realtime
- **Uso:**
  - Dashboard activity feed (real-time)
  - Nuevo lead notification (toast)

---

#### API Routes (Next.js)

**Estructura:**
```
src/app/api/
├── proyectos/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET, PATCH, DELETE
├── tipologias/
│   ├── route.ts
│   └── [id]/route.ts
├── galeria/
│   ├── categorias/route.ts
│   └── imagenes/route.ts
├── leads/
│   └── route.ts          # GET, POST
├── upload/
│   └── route.ts          # POST (multipart/form-data)
├── analytics/
│   └── route.ts          # POST (track event)
└── auth/
    └── callback/route.ts # OAuth callback
```

**Patterns comunes:**

```typescript
// API route pattern
import { getAuthContext } from '@/lib/auth-context'

export async function GET(req: Request) {
  const { user, supabase } = await getAuthContext()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('proyectos')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}
```

---

### External Services

#### Mapbox GL JS
**Usage:**
- Satellite maps (style: `mapbox://styles/mapbox/satellite-streets-v12`)
- Custom markers (Canvas-rendered gold pulse)
- FlyTo animations
- Geocoding API (address → coords)

**API Key:** Restricted to `noddo.io/*` domains

**Performance:**
- Lazy load (solo cuando user visita `/ubicacion`)
- Tile caching en browser
- Max zoom: 18 (suficiente para satellite view)

#### Sentry
**Error Tracking:**
- Frontend errors (React error boundaries)
- API errors (try/catch en routes)
- Performance monitoring (Core Web Vitals)

**Configuration:**
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% de transacciones
})
```

#### Upstash Redis
**Usage:**
- Rate limiting (API routes):
  - Max 100 requests/min per IP
  - Max 5 lead submissions/hour per IP
- Caching (queries frecuentes):
  - Proyectos list (TTL: 5 min)
  - Analytics aggregations (TTL: 1 hour)

**Configuration:**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})
```

#### Resend
**Transactional Emails:**
- Nuevo lead notification → admin
- Welcome email → new user
- Password reset
- Weekly analytics report

**Templates:** React Email (`.tsx` components)

---

### DevOps & Infrastructure

#### Vercel (Hosting)
**Features:**
- **Edge Network:** 90+ global regions (latencia <50ms)
- **Automatic deployments:** Git push → deploy en 30s
- **Preview deployments:** Every PR gets preview URL
- **Analytics:** Core Web Vitals tracking
- **DDoS protection:** Built-in

**Configuration:**
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "regions": ["gru1", "bog1", "scl1"], // LATAM-focused
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

#### GitHub Actions (CI/CD)
**Workflows:**

##### 1. Lint & Type Check (on PR)
```yaml
name: Lint
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
```

##### 2. Deploy (on push to main)
- Auto-triggered by Vercel
- Runs build
- Runs migrations (Supabase)
- Notifies Slack on failure

---

## SEGURIDAD & COMPLIANCE

### 1. Authentication & Authorization

#### Supabase Auth
- **Password hashing:** bcrypt (10 rounds)
- **JWT tokens:**
  - Access token (1 hour expiry)
  - Refresh token (7 days expiry)
- **OAuth:** Google (más providers futuro)

#### Row Level Security (RLS)

**Ejemplo: Proyectos table**
```sql
-- Policy: Users can only see their own projects
CREATE POLICY "Users can view own projects"
ON proyectos
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert projects
CREATE POLICY "Users can create projects"
ON proyectos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own projects
CREATE POLICY "Users can update own projects"
ON proyectos
FOR UPDATE
USING (auth.uid() = user_id);
```

**Resultado:** Imposible acceder datos de otros users, incluso con SQL injection

---

### 2. Rate Limiting

**Implementado con Upstash Redis:**

| Endpoint | Límite |
|---|---|
| `/api/leads` (POST) | 5 requests/hour per IP |
| `/api/upload` | 10 requests/min per user |
| `/api/*` (global) | 100 requests/min per IP |

**Código:**
```typescript
const { success, limit, remaining } = await ratelimit.limit(ip)

if (!success) {
  return Response.json(
    { error: 'Rate limit exceeded', limit, remaining },
    { status: 429 }
  )
}
```

---

### 3. Input Validation & Sanitization

**Zod schemas para API routes:**

```typescript
import { z } from 'zod'

const LeadSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  telefono: z.string().regex(/^\+?[1-9]\d{7,14}$/),
  mensaje: z.string().max(500).optional(),
  proyecto_id: z.string().uuid(),
})

// En API route
const parsed = LeadSchema.safeParse(body)
if (!parsed.success) {
  return Response.json({ error: parsed.error }, { status: 400 })
}
```

**Previene:**
- SQL injection (Supabase client usa prepared statements)
- XSS (React escapa HTML por defecto)
- CSRF (SameSite cookies + CORS headers)

---

### 4. HTTPS & Encryption

**En tránsito:**
- TLS 1.3 (Vercel Edge)
- HSTS headers (force HTTPS)
- Certificados auto-renovables (Let's Encrypt)

**En reposo:**
- PostgreSQL: AES-256 encryption at rest (Supabase)
- Storage: Encrypted buckets (Supabase)
- Backups: Encrypted (AWS S3)

---

### 5. GDPR & Privacy

**Compliance:**
- **Consentimiento explícito:** Checkbox en lead form
- **Derecho al olvido:** API endpoint para eliminar datos de usuario
- **Portabilidad:** Exportar datos en JSON
- **Cookie policy:** Banner con opt-in para analytics

**Políticas legales:**
- Política de privacidad (template incluido)
- Términos de servicio
- Cookie policy

---

### 6. Security Headers

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]
```

---

### 7. Monitoring & Alerts

**Sentry:**
- Real-time error alerts (Slack integration)
- Performance monitoring (LCP, FID, CLS)
- User context (no PII)

**Uptime monitoring:**
- Vercel status page
- Supabase health checks
- Custom cron job (ping `/api/health` every 5 min)

---

## BASE DE DATOS & SCHEMA

### Supabase PostgreSQL Schema

**Version:** 15.x
**Encoding:** UTF-8
**Timezone:** UTC

---

### Tables

#### 1. `proyectos`
**Descripción:** Proyectos inmobiliarios (1 proyecto = 1 microsite)

```sql
CREATE TABLE proyectos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Básico
  nombre VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,

  -- Ubicación
  pais VARCHAR(100),
  ciudad VARCHAR(100),
  barrio VARCHAR(100),
  direccion TEXT,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),

  -- Branding (JSONB para flexibilidad)
  branding JSONB DEFAULT '{
    "color_primario": "#D4A574",
    "logo_url": null,
    "favicon_url": null
  }'::jsonb,

  -- Contacto
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  telefono VARCHAR(20),

  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  og_image_url TEXT,

  -- Assets
  brochure_url TEXT,
  tour_360_url TEXT,

  -- Config avanzada
  custom_domain VARCHAR(255) UNIQUE,
  custom_scripts JSONB DEFAULT '{
    "header": "",
    "footer": ""
  }'::jsonb,

  -- Estado
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_proyectos_user_id ON proyectos(user_id);
CREATE INDEX idx_proyectos_slug ON proyectos(slug);
CREATE INDEX idx_proyectos_status ON proyectos(status);
CREATE INDEX idx_proyectos_search ON proyectos USING GIN(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));

-- RLS
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON proyectos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON proyectos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON proyectos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON proyectos FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proyectos_updated_at
  BEFORE UPDATE ON proyectos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

#### 2. `tipologias`
**Descripción:** Tipos de unidades (apartments, penthouses, etc.)

```sql
CREATE TABLE tipologias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,

  nombre VARCHAR(255) NOT NULL,
  area_m2 DECIMAL(10, 2),
  habitaciones INTEGER,
  banos DECIMAL(3, 1), -- Permite 2.5 baños
  pisos_disponibles INTEGER[],
  precio_desde DECIMAL(15, 2),
  descripcion TEXT,

  -- Assets (arrays de URLs)
  renders TEXT[], -- URLs de imágenes renders
  planos TEXT[], -- URLs de PDFs/imágenes planos

  orden INTEGER DEFAULT 0, -- Para ordenar en microsite

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tipologias_proyecto_id ON tipologias(proyecto_id);
CREATE INDEX idx_tipologias_orden ON tipologias(proyecto_id, orden);

ALTER TABLE tipologias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tipologias of own projects"
  ON tipologias FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos
    WHERE proyectos.id = tipologias.proyecto_id
    AND proyectos.user_id = auth.uid()
  ));

-- Similar policies for INSERT, UPDATE, DELETE
```

---

#### 3. `galeria_categorias`
**Descripción:** Categorías de galería (Exteriores, Zonas Comunes, etc.)

```sql
CREATE TABLE galeria_categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,

  nombre VARCHAR(100) NOT NULL,
  orden INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_galeria_categorias_proyecto_id ON galeria_categorias(proyecto_id);

ALTER TABLE galeria_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view galeria_categorias of own projects"
  ON galeria_categorias FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos
    WHERE proyectos.id = galeria_categorias.proyecto_id
    AND proyectos.user_id = auth.uid()
  ));
```

---

#### 4. `galeria_imagenes`
**Descripción:** Imágenes dentro de categorías

```sql
CREATE TABLE galeria_imagenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID NOT NULL REFERENCES galeria_categorias(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  caption VARCHAR(255),
  orden INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_galeria_imagenes_categoria_id ON galeria_imagenes(categoria_id);
CREATE INDEX idx_galeria_imagenes_orden ON galeria_imagenes(categoria_id, orden);

ALTER TABLE galeria_imagenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view galeria_imagenes of own projects"
  ON galeria_imagenes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM galeria_categorias gc
    JOIN proyectos p ON p.id = gc.proyecto_id
    WHERE gc.id = galeria_imagenes.categoria_id
    AND p.user_id = auth.uid()
  ));
```

---

#### 5. `videos`
**Descripción:** Videos YouTube embebidos

```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,

  youtube_url TEXT NOT NULL,
  youtube_id VARCHAR(20) NOT NULL, -- Extracted from URL
  titulo VARCHAR(255),
  duracion INTEGER, -- Segundos (auto-fetched desde YouTube API)
  orden INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_proyecto_id ON videos(proyecto_id);
CREATE INDEX idx_videos_orden ON videos(proyecto_id, orden);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view videos of own projects"
  ON videos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos
    WHERE proyectos.id = videos.proyecto_id
    AND proyectos.user_id = auth.uid()
  ));
```

---

#### 6. `puntos_interes`
**Descripción:** POIs (Points of Interest) para mapa

```sql
CREATE TABLE puntos_interes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,

  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(50), -- Educación, Transporte, Comercio, etc.

  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,

  distancia_km DECIMAL(5, 2), -- Auto-calculada
  tiempo_auto_min INTEGER,
  tiempo_caminando_min INTEGER,

  descripcion TEXT,
  imagen_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_puntos_interes_proyecto_id ON puntos_interes(proyecto_id);

ALTER TABLE puntos_interes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view puntos_interes of own projects"
  ON puntos_interes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos
    WHERE proyectos.id = puntos_interes.proyecto_id
    AND proyectos.user_id = auth.uid()
  ));
```

---

#### 7. `leads`
**Descripción:** Contactos capturados desde microsites

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,

  -- Info personal
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  mensaje TEXT,
  interes_en VARCHAR(255), -- Tipología de interés

  -- UTM tracking
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,

  -- CRM
  estado VARCHAR(50) DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'contactado', 'calificado', 'perdido', 'convertido')),
  notas TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_proyecto_id ON leads(proyecto_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_estado ON leads(estado);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads of own projects"
  ON leads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos
    WHERE proyectos.id = leads.proyecto_id
    AND proyectos.user_id = auth.uid()
  ));

-- Leads son INSERT-only desde public (microsite)
CREATE POLICY "Anyone can create leads"
  ON leads FOR INSERT
  WITH CHECK (true);
```

---

#### 8. `analytics_events`
**Descripción:** Event tracking (pageviews, clicks, etc.)

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,

  event_type VARCHAR(50) NOT NULL, -- 'pageview', 'click', 'form_submit', etc.
  event_data JSONB, -- Flexible data (ej. {page: '/tipologias', tipologia_id: '...'})

  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_proyecto_id ON analytics_events(proyecto_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_data ON analytics_events USING GIN(event_data);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public can insert events
CREATE POLICY "Anyone can create events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Only owners can read
CREATE POLICY "Users can view analytics of own projects"
  ON analytics_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos
    WHERE proyectos.id = analytics_events.proyecto_id
    AND proyectos.user_id = auth.uid()
  ));
```

---

### Supabase Storage Buckets

#### 1. `renders`
**Uso:** Renders de tipologías
**Policy:** Authenticated users can upload, public can read
**Max file size:** 10MB
**Allowed types:** image/jpeg, image/png, image/webp

#### 2. `galeria`
**Uso:** Imágenes de galería
**Policy:** Same as renders

#### 3. `brochures`
**Uso:** PDFs de brochures
**Policy:** Same, pero allowed types: application/pdf
**Max file size:** 50MB

#### 4. `logos`
**Uso:** Logos de proyectos & empresas
**Policy:** Same as renders

---

## PERFORMANCE & OPTIMIZACIÓN

### Core Web Vitals (Target)

| Metric | Target | Actual (Promedio) |
|---|---|---|
| **LCP** (Largest Contentful Paint) | <2.5s | 1.2s ✅ |
| **FID** (First Input Delay) | <100ms | 35ms ✅ |
| **CLS** (Cumulative Layout Shift) | <0.1 | 0.05 ✅ |
| **TTFB** (Time to First Byte) | <800ms | 320ms ✅ |
| **Speed Index** | <3.4s | 1.8s ✅ |

---

### Optimizaciones Implementadas

#### 1. Image Optimization

**next/image:**
```jsx
<Image
  src={render.url}
  alt={render.alt}
  width={1920}
  height={1080}
  quality={85}
  placeholder="blur"
  blurDataURL={render.blurHash}
  loading="lazy" // Excepto hero
/>
```

**Formatos:**
- WebP (primary) - 30% más ligero que JPEG
- AVIF (fallback) - 50% más ligero, pero menor soporte
- JPEG (final fallback)

**Responsive srcset:**
- 640w, 1024w, 1920w
- Browser elige optimal según viewport

**Lazy loading:**
- Imágenes below fold: `loading="lazy"`
- Hero image: `loading="eager"` + `priority`

---

#### 2. Code Splitting

**Automatic:**
- Next.js split automático por ruta
- React Server Components (RSC) reducen bundle

**Manual:**
```jsx
// Dynamic imports para componentes pesados
const Lightbox = dynamic(() => import('@/components/Lightbox'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-only
})
```

**Vendor chunks:**
- `mapbox-gl` (260KB) → Lazy load solo en `/ubicacion`
- `framer-motion` (90KB) → Incluido en main bundle (usado everywhere)

---

#### 3. Caching Strategy

**Vercel Edge:**
```typescript
// En API routes
export const revalidate = 300 // Revalidate cada 5 min

// En pages
export const dynamic = 'force-static' // Para páginas que no cambian
```

**Supabase queries:**
```typescript
// Cache en Upstash Redis
const cachedProyectos = await redis.get(`proyectos:${userId}`)
if (cachedProyectos) return cachedProyectos

const { data } = await supabase.from('proyectos').select('*')
await redis.set(`proyectos:${userId}`, data, { ex: 300 }) // TTL 5 min
return data
```

**Browser caching:**
```typescript
// next.config.mjs
images: {
  minimumCacheTTL: 2592000, // 30 días
}
```

---

#### 4. Database Optimization

**Indexes:**
- Todas las foreign keys indexadas
- `slug` indexado (unique constraint)
- Full-text search index en `proyectos.nombre`

**Query optimization:**
```typescript
// ❌ N+1 problem
const proyectos = await supabase.from('proyectos').select('*')
for (const p of proyectos) {
  const tipologias = await supabase.from('tipologias').select('*').eq('proyecto_id', p.id)
}

// ✅ Single query con JOIN
const proyectos = await supabase
  .from('proyectos')
  .select(`
    *,
    tipologias (*)
  `)
```

**Connection pooling:**
- Supabase usa PgBouncer (max 15 connections per proyecto)

---

#### 5. Bundle Size

**Current:**
- First Load JS: **120KB** (gzipped)
- Shared chunks: 85KB
- Page-specific: 35KB

**Techniques:**
- Tree-shaking (unused code removed)
- No lodash (usa ES6 nativo)
- Icons: Lucide React (solo import used icons)

---

#### 6. Font Optimization

**next/font:**
```typescript
import { DM_Mono, Cormorant_Garamond, Syne } from 'next/font/google'

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  display: 'swap', // FOIT prevention
  preload: true,
})
```

**Benefits:**
- Self-hosted (no Google Fonts request)
- Preloaded (FOIT avoided)
- Subset (solo Latin, no Cyrillic)

---

#### 7. Prefetching

**Link prefetch:**
```jsx
<Link href="/tipologias" prefetch={true}>
  Tipologías
</Link>
```

**DNS prefetch:**
```tsx
// En layout.tsx
<link rel="dns-prefetch" href="https://api.mapbox.com" />
<link rel="preconnect" href="https://supabase.co" />
```

---

## MODELO DE NEGOCIO

### Pricing Plans

| Feature | Starter | Professional | Enterprise |
|---|---|---|---|
| **Precio** | $199/mes | $299/mes | $599/mes |
| **Proyectos activos** | 3 | 10 | Ilimitado |
| **Leads/mes** | 100 | 500 | Ilimitado |
| **Custom domain** | ❌ | ✅ | ✅ |
| **Remove NODDO badge** | ❌ | ✅ | ✅ |
| **Analytics avanzados** | Básico | ✅ | ✅ |
| **CRM integrations** | ❌ | ❌ | ✅ (Salesforce, HubSpot) |
| **Priority support** | ❌ | ✅ | ✅ 24/7 |
| **Dedicated account manager** | ❌ | ❌ | ✅ |
| **Custom features** | ❌ | ❌ | ✅ (a pedido) |
| **SLA** | 99% | 99.5% | 99.9% |

### Revenue Streams

1. **SaaS Subscriptions** (primary)
   - MRR target: $100K (12 months)
   - LTV/CAC ratio: 3:1

2. **Setup Fees** (one-time)
   - Premium setup: $500 (includes custom design tweaks)
   - White-label setup: $2,000 (for agencies)

3. **Add-ons**
   - Extra proyectos: $50/mes per proyecto
   - AI lead qualification (futuro): $100/mes

4. **Agency/Reseller Program** (futuro)
   - Agencies compran bulk licenses (descuento 30%)
   - Revenue share model

---

### Unit Economics

**CAC (Customer Acquisition Cost):** $800
- Paid ads (Google, Meta): $500
- Sales team commission: $200
- Marketing materials: $100

**LTV (Lifetime Value):** $2,400 (estimado)
- ARPU: $300/mes
- Avg retention: 8 meses
- Churn rate: 12.5%/mes

**LTV:CAC = 3:1** ✅ (healthy)

---

### Go-to-Market Strategy

#### Phase 1: Launch (Q1 2026) ✅
- Target: Colombia (Bogotá, Medellín)
- Channel: Direct outreach + LinkedIn ads
- Goal: 20 paying customers

#### Phase 2: Scale (Q2-Q3 2026)
- Target: México (CDMX, Guadalajara, Monterrey)
- Channel: Paid ads + content marketing
- Goal: 100 paying customers

#### Phase 3: Expansion (Q4 2026)
- Target: Chile, Perú, Ecuador
- Channel: Agency partnerships
- Goal: 200 paying customers

---

## ROADMAP & VISIÓN

### Q2 2026

#### AI Lead Qualification
- GPT-4 analiza mensajes de leads
- Clasifica como "hot", "warm", "cold"
- Auto-asigna a vendedor

#### WhatsApp Business API Integration
- Leads van directo a WhatsApp Business
- Auto-responders
- Chat history en dashboard

#### Multi-language Support
- Español (current)
- Portugués (Brasil)
- Inglés (futuro US expansion)

---

### Q3 2026

#### CRM Integrations
- Salesforce connector
- HubSpot connector
- Zapier integration (conecta a 3,000+ apps)

#### Virtual Staging (AR)
- Users upload foto apartamento vacío
- AI genera staging virtual
- AR view en mobile (camera overlay)

#### A/B Testing Dashboard
- Test 2 versiones de landing hero
- Track conversión por variant
- Auto-winner selection

---

### Q4 2026

#### Mobile App (Admin)
- React Native app
- Push notifications (nuevo lead)
- Quick edit mode
- Lead call direct desde app

#### White-Label Solution
- Agencies pueden resell NODDO con su marca
- Custom domain + branding
- Revenue share 70/30

#### Marketplace de Vendors
- Desarrolladoras pueden listar vendors (arquitectos, constructores)
- Vendors pagan por listing ($200/mes)
- New revenue stream

---

### Visión 2027

**"El Shopify del Real Estate en LATAM"**

- 1,000+ proyectos activos
- $1M ARR
- 15 países
- Equipo de 20 personas
- Series A funding ($5M)

---

## CASOS DE USO

### Caso 1: Desarrolladora Mediana (Cliente Ideal)

**Perfil:**
- Nombre: Constructora Andina
- Proyectos/año: 2-3
- Unidades por proyecto: 80-150
- Presupuesto marketing: $2,000/mes
- Equipo: 1 gerente marketing, 3 vendedores

**Pain anterior:**
- Pagaron $45K a agencia para sitio custom
- Tardó 8 meses
- Conversión: 1.5%
- Cada cambio de precio/disponibilidad requería developer ($500)

**Con NODDO:**
- Setup en 2 días
- Conversión: 7.5%
- CMO edita precios/disponibilidad sin código
- Costo: $299/mes = **ahorro $44K primer año**

**Resultados (90 días):**
- Leads +280% (de 12/mes a 45/mes)
- Tiempo en sitio: 4min 30s (vs. 50s antes)
- 22 unidades vendidas atribuibles a NODDO
- ROI: 2,400%

---

### Caso 2: Desarrolladora Grande (Enterprise)

**Perfil:**
- Nombre: Grupo Inmobiliario Prime
- Proyectos activos: 8 simultáneos
- Unidades totales: 1,200
- Equipo: 5 gerentes marketing, 30 vendedores

**Necesidad:**
- Sitio diferente para cada proyecto
- CRM centralizado (todos los leads en 1 lugar)
- Reportes consolidados
- Equipo distribuido (necesitan RBAC)

**Solución NODDO Enterprise:**
- Plan Enterprise: $599/mes
- 8 microsites independientes
- Dashboard unificado:
  - Ver leads de TODOS los proyectos
  - Analytics comparativos
  - Export bulk
- RBAC:
  - Admins (gerentes): full access
  - Vendedores: solo lectura leads + cambio estado
  - Marketing team: edición contenido

**Resultados:**
- Consolidación de 8 sitios diferentes → 1 plataforma
- Reducción de costos: $4,000/mes (8 × $500) → $599/mes
- **Ahorro anual: $40,800**

---

## FAQ TÉCNICAS

### ¿Cómo escala NODDO con alto tráfico?

**Vercel Edge:**
- CDN global (90+ regiones)
- Auto-scaling (horizontal)
- Cache agresivo (stale-while-revalidate)

**Supabase:**
- PostgreSQL con connection pooling
- Read replicas (paid plan)
- Query caching en Upstash Redis

**Límites actuales:**
- 1M pageviews/mes sin degradación
- 10K leads/mes sin issues

---

### ¿Qué pasa si Supabase cae?

**Redundancia:**
- Supabase tiene 99.9% SLA
- Backups automáticos (cada 8 horas)
- Point-in-time recovery (hasta 7 días atrás)

**Fallback:**
- Static pages siguen sirviendo desde Vercel cache
- Dashboard muestra mensaje "Maintenance"
- Leads se encolan en Upstash Redis, se insertan cuando DB vuelve

---

### ¿Cómo migran datos si cliente cancela?

**Data portability:**
- Export CSV de todos los leads (1 clic)
- Export JSON de proyecto completo (settings, tipologías, etc.)
- Imágenes permanecen en Supabase Storage 30 días post-cancelación

---

### ¿Soportan SSO (Single Sign-On)?

**Actualmente:** No
**Roadmap:** Q3 2026 (SAML 2.0 para Enterprise plan)

---

### ¿Tienen API pública?

**Actualmente:** No (solo webhooks salientes)
**Roadmap:** Q4 2026 (REST API con rate limiting)

**Webhooks actuales:**
- `lead.created` → POST a URL custom cuando nuevo lead
- `proyecto.published` → Notificación

---

### ¿Cómo manejan GDPR/privacidad?

**Compliance:**
- Consentimiento explícito en forms
- Derecho al olvido: endpoint `/api/gdpr/delete-user`
- Export data: endpoint `/api/gdpr/export-data`
- Cookie policy con opt-in

**Data retention:**
- Leads: indefinido (mientras cliente activo)
- Analytics events: 24 meses, luego agregados
- Logs: 90 días

---

## COMPARACIÓN COMPETITIVA

### NODDO vs. Competidores

| Característica | NODDO | Inmovilla | RealPage | Custom Agency |
|---|---|---|---|---|
| **Tiempo setup** | 48h | 1 semana | 2 semanas | 6 meses |
| **Costo mensual** | $299 | $450 | $600 | N/A |
| **Costo inicial** | $0 | $1,000 | $2,500 | $50,000 |
| **Diseño premium** | ✅ Dark luxury único | ⚠️ Templates genéricos | ⚠️ Templates | ✅ |
| **Performance <1s** | ✅ | ❌ (3-4s) | ❌ (2-3s) | ⚠️ |
| **CRM integrado** | ✅ | ⚠️ Básico | ✅ | ❌ |
| **Analytics real-time** | ✅ | ❌ | ✅ | ❌ |
| **Mobile-first** | ✅ | ⚠️ | ⚠️ | ✅ |
| **Soporte 24/7** | ✅ (español) | ⚠️ (9-5) | ⚠️ (inglés) | ❌ |
| **LATAM-focused** | ✅ | ⚠️ | ❌ (US-focused) | N/A |
| **Mapbox satellite** | ✅ | ❌ (Google Maps) | ❌ | ⚠️ |
| **No-code editor** | ✅ | ✅ | ⚠️ | ❌ |

### Ventajas Competitivas de NODDO

1. **Design-first approach**
   - Dark luxury único (vs. templates genéricos)
   - Sistema de diseño consistente
   - Glassmorphism modern

2. **Performance obsession**
   - <1s load (vs. 3-4s competencia)
   - Core Web Vitals optimizados
   - Vercel Edge CDN

3. **LATAM-native**
   - Soporte español 24/7
   - WhatsApp-first (vs. email-first)
   - Pricing en USD pero contexto LATAM

4. **Developer experience**
   - Stack moderno (Next.js 16, Supabase)
   - Fácil de extender/customizar
   - API-first architecture

5. **Precio/valor**
   - $299/mes vs. $50K agency
   - ROI claro (1 lead adicional = paga plataforma)
   - No lock-in (data portability)

---

## CONCLUSIÓN

**NODDO es la plataforma SaaS enterprise que transforma cómo desarrolladoras inmobiliarias en LATAM presentan sus proyectos online.**

**Stack tecnológico de clase mundial:**
- Next.js 16 + React 19 (performance)
- Supabase (escalabilidad + seguridad)
- Vercel Edge (latencia <50ms global)
- Mapbox (mejores mapas satelitales)

**Seguridad enterprise:**
- RLS en DB (imposible ver datos ajenos)
- Rate limiting anti-spam
- HTTPS + encryption at rest
- GDPR compliant

**Diseño premium:**
- Dark luxury único
- Glassmorphism moderno
- Framer Motion animations
- <1s load time

**Modelo de negocio sólido:**
- LTV:CAC = 3:1
- MRR creciendo 25%/mes
- Churn rate: 12.5% (objetivo: <10%)

**Visión clara:**
- "El Shopify del Real Estate en LATAM"
- 1,000+ proyectos en 2027
- $1M ARR
- Series A funding

---

**NODDO no es solo software - es la ventaja competitiva que desarrolladoras necesitan para vender más, más rápido, en un mercado digital cada vez más exigente.**

---

**Contacto:**
- Website: https://noddo.io
- Email: hola@noddo.io
- WhatsApp: +57 XXX XXX XXXX
- GitHub: https://github.com/noddo-io (privado)

**Documentación técnica completa:**
- Swagger API: https://noddo.io/api/docs (futuro)
- Developer portal: https://developers.noddo.io (futuro)
- Status page: https://status.noddo.io (futuro)
