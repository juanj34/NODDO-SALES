# Mapa de Navegación NODDO — Acceso a Todas las Funcionalidades

> **Última actualización:** 2026-03-15
> **Propósito:** Guía rápida de dónde encontrar cada funcionalidad en la plataforma

---

## 🎯 Dashboard Principal (Usuarios)

**URL Base:** `https://noddo.io`

**Sidebar izquierdo:**

### Proyectos
- **`/proyectos`** — Lista de todos tus proyectos
  - ✅ Ver, editar, duplicar, eliminar proyectos
  - ✅ Botón "Crear proyecto" para nuevo proyecto
  - ✅ Estadísticas rápidas (leads, vistas, conversión)

---

### 🛠 Herramientas

#### **`/disponibilidad`** — Gestión de disponibilidad
- Vista global de inventario across todos los proyectos
- Filtros por proyecto, estado, tipología
- Cambio masivo de estados
- Export CSV
- **Acceso:** Admins + Colaboradores

#### **`/cotizador`** — Cotizaciones
- ✅ Vista global de cotizaciones generadas
- ✅ Filtros por proyecto, fecha, estado
- ✅ Ver PDF descargable
- ✅ Datos del comprador (nombre, email, teléfono)
- ✅ Unidad cotizada (identificador, tipología, precio)
- **Acceso:** Solo admins

#### **`/leads`** — Registros (CRM)
- ✅ Vista global de todos los leads
- ✅ Multi-filtro: proyecto, status, tipología, fuente, fecha
- ✅ Estadísticas (total, este mes, con cotizaciones)
- ✅ Breakdowns por status, proyecto, fuente
- ✅ Panel de detalle con historial
- ✅ Export CSV
- **Acceso:** Admins + Colaboradores

#### **`/analytics`** — Analytics
- ✅ Vista global de métricas across todos los proyectos
- ✅ Filtros por proyecto, rango de fechas
- ✅ Métricas: vistas, visitantes, sesiones, eventos
- ✅ Breakdowns: página, dispositivo, país, referrer
- ✅ Conversión, bounce rate, avg pages/session
- ✅ Leads over time, leads by source
- ✅ Métricas financieras (si hay inventario)
- **Acceso:** Solo admins

---

### 👥 Equipo (Solo Admin)

#### **`/equipo`** — Team Management
- ✅ Invitar colaboradores (máx 3)
- ✅ Asignar proyectos específicos
- ✅ Pausar/activar acceso
- ✅ Ver último acceso
- **Restricción:** Solo propietarios (admins)

---

### ⚙️ Cuenta

#### **`/cuenta`** — Settings
- Perfil de usuario
- Cambiar contraseña
- Configuración de notificaciones
- Sub-rutas:
  - `/cuenta/reportes` — Reportes y analytics personales

---

### ❓ Ayuda

#### **`/ayuda`** — Help Center
- Documentación
- Tutoriales
- FAQs
- Contacto soporte

---

### 🛡 Admin (Solo Platform Admins)

**Badge rojo en sidebar** → Acceso a **`/admin`**

---

## 📝 Editor de Proyecto

**URL Base:** `/editor/[id]`

**Sidebar izquierdo con tabs agrupados:**

---

### 📁 PROYECTO

#### **`/editor/[id]`** (General) — Default tab
- Información básica del proyecto
- Nombre, descripción, constructora
- Estado (borrador/publicado)
- Logo, renders principales

#### **`/editor/[id]/torres`** — Torres/Etapas
- Gestión de torres (edificios) o etapas (casas)
- Orden, nombres, renders de fachada
- Configuración de visualización
- **Nota:** Icon cambia según tipo (Building vs Home)

---

### 🎨 CONTENIDO

#### **`/editor/[id]/tipologias`** — Tipologías
- ✅ CRUD de tipologías (apartamentos, casas)
- ✅ Renders (upload + gestión)
- ✅ Floor plans (upload + gestión)
- ✅ Especificaciones (habitaciones, baños, área, etc.)
- ✅ Precios (si inventory tracking habilitado)
- ✅ Orden de presentación
- **Badge:** Cuenta de tipologías

#### **`/editor/[id]/inventario`** — Inventario
- ✅ CRUD de unidades individuales
- ✅ Bulk upload via CSV
- ✅ Estados: disponible, reservada, vendida
- ✅ Asignación a tipología, torre, piso
- ✅ Specs individuales (vista, orientación, parqueaderos)
- ✅ Tracking de cambios de estado (historial)
- **Badge:** Cuenta de unidades
- **Acceso:** Admins + Colaboradores

#### **`/editor/[id]/fachadas`** — NODDO Grid (Fachadas)
- ✅ Upload de renders de fachada por torre
- ✅ Configuración de hotspots (clickable units)
- ✅ Modo exploración interactiva
- ✅ Dual mode: vertical scroll vs modal
- **Badge:** Cuenta de renders

#### **`/editor/[id]/implantaciones`** — Implantaciones
- ✅ Upload de master plans, site plans
- ✅ Orden de presentación
- ✅ Gestión de imágenes
- **Badge:** Cuenta de implantaciones

#### **`/editor/[id]/galeria`** — Galería
- ✅ Categorías (renders, amenidades, acabados, etc.)
- ✅ Upload masivo de imágenes
- ✅ Orden dentro de cada categoría
- ✅ Preview en lightbox
- **Badge:** Cuenta de categorías

#### **`/editor/[id]/videos`** 🔒 — Videos
- ✅ YouTube links
- ✅ Cloudflare Stream uploads
- ✅ Orden de presentación
- **Badge:** Cuenta de videos
- **Feature Lock:** Requiere plan con feature `videos`

#### **`/editor/[id]/tour-360`** 🔒 — Tour 360
- ✅ Matterport URL
- ✅ Custom iframe URL
- ✅ Configuración de visualización
- **Feature Lock:** Requiere plan con feature `tour_360`

#### **`/editor/[id]/ubicacion`** — Ubicación
- ✅ Coordenadas GPS (lat/lng)
- ✅ Mapbox satellite view
- ✅ Puntos de interés (POIs)
- ✅ Distancias calculadas
- ✅ Tiempos de viaje
- ✅ Categorías de POIs
- **Badge:** Cuenta de POIs

#### **`/editor/[id]/recursos`** — Recursos
- ✅ Upload de brochures (PDF)
- ✅ Documentos descargables
- ✅ Gestión de archivos
- **Badge:** Cuenta de recursos

#### **`/editor/[id]/avances`** — Avances de Obra
- ✅ Timeline de construcción
- ✅ Fechas de hitos
- ✅ Fotos/videos de progreso
- ✅ Descripción de cada fase
- **Badge:** Cuenta de avances

---

### ⚙️ AJUSTES

#### **`/editor/[id]/config`** — Configuración
- ✅ Configuración general del proyecto
- ✅ Branding (colores, logo)
- ✅ SEO (meta tags, description)
- ✅ Disclaimer legal
- ✅ WhatsApp de contacto
- ✅ Toggle de features (galería, videos, tour, etc.)

#### **`/editor/[id]/dominio`** 🔒 — Dominio
- ✅ Configuración de custom domain
- ✅ Subdomain management
- ✅ DNS verification status
- ✅ SSL certificate status
- ✅ Instrucciones de configuración DNS
- **Feature Lock:** Requiere plan con feature `custom_domain`
- **Documentación:** Ver `.claude/custom-domains-testing.md`

#### **`/editor/[id]/webhooks`** 🔒 — Webhooks
- ✅ Configuración de webhook URL
- ✅ Secret key para HMAC signatures
- ✅ Eventos: `lead.created`, `cotizacion.created`
- ✅ Testing de webhooks
- ✅ Logs de dispatch
- **Feature Lock:** Requiere plan con feature `webhooks`
- **Documentación:** Ver `src/lib/webhooks.ts` + `.env.example`

---

### 📊 DATOS

#### **`/editor/[id]/estadisticas`** 🔒 — Estadísticas
- ✅ Analytics específicas del proyecto
- ✅ Vistas, visitantes, sesiones
- ✅ Breakdowns (página, dispositivo, país, fuente)
- ✅ Leads over time
- ✅ Métricas financieras
- ✅ Conversion rate
- **Feature Lock:** Requiere plan con feature `analytics`
- **Documentación:** Ver `.claude/analytics-system.md`

---

### 🛠 HERRAMIENTAS

#### **`/editor/[id]/disponibilidad`** — Disponibilidad
- ✅ Vista de inventario del proyecto específico
- ✅ Cambio de estados
- ✅ Vista rápida de disponibilidad
- **Acceso:** Admins + Colaboradores

#### **`/editor/[id]/cotizador`** 🔒 — Cotizador
- ✅ Configuración del cotizador
- ✅ Moneda, cuota inicial, financiamiento
- ✅ Tasas de interés
- ✅ Portada personalizada
- ✅ Textos de saludo/despedida en PDF
- **Feature Lock:** Requiere plan con feature `cotizador`

---

### 🎚 Header Actions (Top Bar)

**Siempre visible en todas las tabs del editor:**

- **Publish Button** — Publicar cambios
  - Modal con preview de cambios
  - Selección de targets: subdomain + custom domain
  - Confirmación antes de publicar
  - Estado: borrador / cambios sin publicar / publicado

- **Preview Button** — Ver previsualización
  - Abre microsite en nueva pestaña
  - Modo preview (sin tracking)

- **Version History** — Historial de versiones
  - Rollback a versiones anteriores
  - Ver qué cambió en cada versión
  - Timestamp + usuario que publicó

---

## 🌐 Micrositio Público

**URL Base:** `https://[proyecto].noddo.io` o `https://[custom-domain]`

**Sidebar izquierdo (expandible/colapsable):**

---

### Páginas Siempre Visibles

#### **`/[slug]`** — Home (Hero)
- Landing page con hero image
- CTA principal
- Gradient overlay
- Información destacada

#### **`/[slug]/galeria`** — Galería
- ✅ Tabs por categorías
- ✅ Horizontal scroll slider
- ✅ Lightbox fullscreen
- ✅ Keyboard navigation (arrows, esc)

#### **`/[slug]/tipologias`** — Tipologías
- ✅ Fullscreen slider
- ✅ Renders background
- ✅ Type selector panel
- ✅ Floor plans modal
- ✅ Specs + pricing
- ✅ CTA para contacto

#### **`/[slug]/inventario`** — Inventario
- ✅ Grid/list toggle
- ✅ Filtros avanzados (tipología, habitaciones, estado, precio)
- ✅ Ordenamiento
- ✅ Vista rápida de specs
- ✅ CTA cotizador (si habilitado)

#### **`/[slug]/explorar`** — Torres/Etapas
- ✅ Dual mode: fachadas interactivas vs modal
- ✅ Hotspots clickables
- ✅ Torre selector
- ✅ Vista inmersiva

#### **`/[slug]/ubicacion`** — Ubicación
- ✅ Mapbox satellite map
- ✅ Project marker (gold pulse)
- ✅ POI markers (white dots)
- ✅ Glass panel con POI details
- ✅ Prev/next navigation
- ✅ FlyTo on selection

#### **`/[slug]/videos`** — Videos
- ✅ YouTube embed
- ✅ Video list sidebar
- ✅ Glass styling

#### **`/[slug]/recursos`** — Recursos
- ✅ Brochures descargables
- ✅ Documentos PDF
- ✅ Enlaces externos

#### **`/[slug]/contacto`** — Contacto
- ✅ Lead form (glass-card)
- ✅ UTM capture automático
- ✅ Validación Zod
- ✅ Email confirmación + admin notification
- ✅ Webhook dispatch (si configurado)

---

### Páginas Condicionales

#### **`/[slug]/implantaciones`** — Implantaciones
- ✅ Floor plans / master plans
- ✅ Visualización interactiva
- **Condicional:** Solo visible si `hasImplantaciones === true`

#### **`/[slug]/avances`** — Avances de Obra
- ✅ Timeline con video/imagen
- ✅ Descripción de cada fase
- **Condicional:** Solo visible si `hasAvances === true`

#### **`/[slug]/tour-360`** — Tour 360
- ✅ Matterport/custom iframe embed
- ✅ Fullscreen mode
- **Condicional:** Solo visible si `hasTour360 === true`

---

### Páginas Sin Link Visible (Acceso Directo)

#### **`/[slug]/brochure`** — Brochure
- ✅ PDF embed con glass styling
- ✅ Full-page viewer
- **Acceso:** URL directa (no aparece en nav)

---

### Floating Elements (Siempre Visibles)

- **WhatsApp Button** — Floating right
  - Tracking de clicks
  - Link configurable por proyecto

- **Audio Player** — Background music (si configurado)
  - Mute/unmute toggle
  - Persiste entre páginas

- **Language Toggle** — Top right
  - ES / EN
  - Persiste en localStorage

- **Currency Selector** — Top right (si cotizador habilitado)
  - COP / USD / MXN
  - Persiste en localStorage

- **Unit Toggle** — Top right (si cotizador habilitado)
  - m² / ft²
  - Persiste en localStorage

---

## 🛡 Panel Admin (Platform Admins Only)

**URL Base:** `/admin`

**Sidebar izquierdo:**

---

### **`/admin`** — Overview (Dashboard)
- ✅ KPIs globales de la plataforma
- ✅ Charts (funnels, top projects)
- ✅ Actividad reciente
- ✅ Métricas de crecimiento

### **`/admin/usuarios`** — Usuarios
- ✅ Lista de todos los usuarios
- ✅ CRUD de usuarios
- ✅ Cambio de plan
- ✅ Ban/unban
- ✅ Ver proyectos del usuario

### **`/admin/proyectos`** — Proyectos
- ✅ Vista global de todos los proyectos
- ✅ Filtros por usuario, estado, fecha
- ✅ Estadísticas por proyecto

### **`/admin/leads`** — Leads
- ✅ Vista global de todos los leads across todos los proyectos
- ✅ Multi-filtro
- ✅ Export CSV

### **`/admin/planes`** — Planes
- ✅ Gestión de planes de subscripción
- ✅ Pricing
- ✅ Features incluidas por plan
- ✅ Límites

### **`/admin/citas`** — Citas (Bookings)
- ✅ Vista global de demos agendadas
- ✅ Status tracking (confirmed, completed, no-show, cancelled)
- ✅ CSV export
- ✅ Email reminders
- **Relacionado:** Email sequences E1-E6 (ver `.claude/email-sequences-testing.md`)

### **`/admin/actividad`** — Actividad (Audit Log)
- ✅ Logs de acciones de usuarios
- ✅ Timestamp + usuario + acción
- ✅ Filtros por tipo de acción

### **`/admin/storage`** — Storage
- ✅ Tracking por proyecto
- ✅ Usage de R2 (Cloudflare)
- ✅ Usage de Stream (videos)
- ✅ Alertas de límites

### **`/admin/admins`** — Admins
- ✅ Gestión de platform admins
- ✅ Agregar/remover permisos
- ✅ Ver actividad de admins

---

## 🔐 Niveles de Acceso

### Usuario Normal (Admin del Proyecto)
- ✅ Dashboard completo
- ✅ Editor completo (todos los tabs)
- ✅ Herramientas (disponibilidad, cotizador, leads, analytics)
- ✅ Equipo (puede invitar colaboradores)
- ✅ Cuenta (settings personales)
- ❌ Panel admin (NO accesible)

### Colaborador
- ✅ Dashboard limitado
- ✅ Editor limitado (solo Inventario + Disponibilidad tabs)
- ✅ Herramientas limitadas (solo Disponibilidad + Leads)
- ❌ NO puede publicar cambios
- ❌ NO puede configurar proyecto
- ❌ NO puede invitar otros colaboradores
- ❌ Panel admin (NO accesible)

### Platform Admin
- ✅ Dashboard completo
- ✅ Editor completo
- ✅ Todas las herramientas
- ✅ **Panel admin completo** (`/admin`)
- ✅ Puede ver/editar TODOS los proyectos de TODOS los usuarios
- ✅ Badge rojo en sidebar con link a `/admin`

---

## 🔒 Feature Locks

Algunas funcionalidades requieren features específicas habilitadas en el plan:

| Feature | Tab Afectado | Plan Requerido |
|---------|-------------|----------------|
| `videos` | Videos | Premium+ |
| `tour_360` | Tour 360 | Premium+ |
| `custom_domain` | Dominio | Pro+ |
| `webhooks` | Webhooks | Pro+ |
| `analytics` | Estadísticas | Pro+ |
| `cotizador` | Cotizador | Premium+ |

**Visual:** Tabs con feature lock muestran icono de candado (🔒) y están deshabilitados hasta que se active la feature en `project_features` table.

---

## 📱 Mobile Access

**Dashboard + Editor:**
- ✅ Mobile drawer (hamburger menu)
- ✅ Responsive layouts
- ✅ Touch-optimized interactions

**Micrositio:**
- ✅ Mobile nav (bottom drawer)
- ✅ Landscape warning overlay (portrait recommended)
- ✅ Responsive images
- ✅ Touch gestures (swipe, pinch, etc.)

---

## ⌨️ Keyboard Shortcuts

**Dashboard:**
- `Ctrl+K` / `Cmd+K` — Command Palette (búsqueda global)
- `Esc` — Cerrar modals
- `Tab` — Navegación por formularios

**Micrositio Galería:**
- `←` / `→` — Prev/Next image en lightbox
- `Esc` — Cerrar lightbox

---

## 🔗 Quick Links (URLs Directas)

### Producción
- Landing: `https://noddo.io`
- Dashboard: `https://noddo.io/dashboard` → redirect a `/proyectos`
- Login: `https://noddo.io/login`
- Micrositio: `https://[proyecto].noddo.io` o custom domain

### Desarrollo
- Local: `http://localhost:3000`
- Preview: `https://noddo-git-[branch]-[team].vercel.app`

---

## 📚 Documentación de Referencia

| Funcionalidad | Documento |
|---------------|-----------|
| Environment Vars | `.env.example` |
| Analytics | `.claude/analytics-system.md` |
| Email Sequences | `.claude/email-sequences-testing.md` |
| Custom Domains | `.claude/custom-domains-testing.md` |
| Vercel Token | `.claude/vercel-token-verification.md` |
| Next.js Images | `.claude/nextjs-image-migration.md` |
| Production Summary | `.claude/production-readiness-summary.md` |

---

## ✅ Resumen

**Todas las funcionalidades implementadas son accesibles desde la UI:**

✅ **Dashboard:** 7 secciones principales + admin badge
✅ **Editor:** 18 tabs en 5 secciones (Proyecto, Contenido, Ajustes, Datos, Herramientas)
✅ **Admin:** 9 secciones de gestión plataforma
✅ **Micrositio:** 11 páginas (8 siempre + 3 condicionales)

**No hay features "perdidas" sin acceso desde la UI.**

**Todas las funcionalidades documentadas en esta sesión:**
- ✅ Analytics → `/analytics` (dashboard) + `/editor/[id]/estadisticas` (editor)
- ✅ Webhooks → `/editor/[id]/webhooks` (editor, feature-locked)
- ✅ Custom Domains → `/editor/[id]/dominio` (editor, feature-locked)
- ✅ Cotizador → `/cotizador` (dashboard) + `/editor/[id]/cotizador` (editor)
- ✅ Email Sequences → Automáticas (no UI, se disparan en booking-handler)

Todo accesible, bien organizado, y con los permisos correctos. 🎉
