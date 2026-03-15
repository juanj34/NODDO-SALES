# Guía de Deployment en Vercel

Esta guía te ayudará a configurar correctamente el proyecto en Vercel para evitar fallos de deployment.

## 🔧 Configuración Requerida

### 1. Variables de Entorno Críticas

En **Vercel Dashboard → Settings → Environment Variables**, agrega las siguientes variables (aplican a Production, Preview y Development):

#### Core Application
```bash
NEXT_PUBLIC_ROOT_DOMAIN=noddo.io
NEXT_PUBLIC_APP_URL=https://noddo.io
```

#### Supabase (REQUERIDO)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### Mapbox (REQUERIDO)
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

#### Resend Email (REQUERIDO)
```bash
RESEND_API_KEY=re_...
```

#### Sentry Error Monitoring (OPCIONAL pero RECOMENDADO)

**Runtime (client/server):**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

**Build-time (para source maps):**
```bash
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

💡 **Cómo obtener el auth token de Sentry:**
1. Ve a https://sentry.io/settings/account/api/auth-tokens/
2. Crea un token con permisos: `project:releases` y `org:read`
3. Copia el token y agrégalo a Vercel

**Si NO configuras Sentry:** El build funcionará igual, pero no tendrás monitoreo de errores ni source maps.

#### Otras (Opcionales)
```bash
# GoHighLevel CRM
GHL_PIT_TOKEN=...
GHL_LOCATION_ID=...
GHL_PIPELINE_ID=...

# Meta Pixel
NEXT_PUBLIC_META_PIXEL_ID=...
META_CONVERSION_API_TOKEN=...

# Google Tag Manager
NEXT_PUBLIC_GTM_ID=GTM-...

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...

# Vercel API (para dominios custom)
VERCEL_API_TOKEN=...
VERCEL_TEAM_ID=...
VERCEL_PROJECT_ID=...

# WhatsApp
WHATSAPP_SUPPORT_NUMBER=+971585407848
```

---

## 🚀 Configuración de Build

### Build Command
El proyecto usa **Webpack** (no Turbopack) en producción para mayor estabilidad:

```bash
npm run build
```

### Node Version
Vercel detecta automáticamente Node.js 20+ desde `package.json`.

### Framework Preset
- **Framework:** Next.js
- **Build Command:** `npm run build` (ya configurado)
- **Output Directory:** `.next` (automático)
- **Install Command:** `npm install` (automático)

---

## 🐛 Troubleshooting

### Error: "Sentry configuration failed"
**Causa:** Faltan variables de Sentry en build-time.

**Solución:** Agrega `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, y `SENTRY_PROJECT` en Vercel, o simplemente ignora (el build funcionará sin Sentry).

### Error: "Failed to compile" / TypeScript errors
**Causa:** TypeScript strict en Vercel.

**Solución:** Ejecuta localmente:
```bash
npm run typecheck
```
Arregla los errores antes de hacer push.

### Error: "FATAL ERROR: Ineffective mark-compacts near heap limit"
**Causa:** Build se queda sin memoria.

**Solución:** Ya configurado en `vercel.json` con `NODE_OPTIONS=--max-old-space-size=4096`.

Si persiste, contacta soporte de Vercel para aumentar límites.

### Error: "Module not found" después del deployment
**Causa:** Dependencia faltante o import case-sensitive.

**Solución:**
- Verifica que todas las dependencias estén en `package.json`
- Windows no distingue mayúsculas/minúsculas, pero Vercel (Linux) sí:
  ```ts
  // ❌ Mal
  import { Foo } from "@/Components/Foo"  // carpeta es 'components' no 'Components'

  // ✅ Bien
  import { Foo } from "@/components/Foo"
  ```

### Deployment lento (>5 minutos)
**Causas comunes:**
1. Sentry subiendo source maps (normal, tarda ~2-3 min extra)
2. First build sin cache (normal)
3. Instalación de dependencias pesadas (sharp, @ffmpeg)

**Soluciones:**
- Los siguientes builds serán más rápidos (cache)
- Si es crítico, considera remover `@ffmpeg` si no lo usas

---

## ✅ Checklist Pre-Deployment

Antes de hacer push a `main`:

- [ ] Todas las variables de entorno están en Vercel
- [ ] `npm run build` pasa localmente sin errores
- [ ] `npm run typecheck` pasa sin errores
- [ ] `.env.local` tiene todas las vars necesarias (para testing local)
- [ ] Commit incluye las migraciones de Supabase (si hay)
- [ ] Tested en modo production localmente: `npm run build && npm run start`

---

## 📊 Monitoreo Post-Deployment

### Vercel Dashboard
- **Analytics:** Ver tráfico y performance
- **Logs:** Runtime logs (errores de API, etc.)
- **Speed Insights:** Core Web Vitals

### Sentry (si configurado)
- **Issues:** Errores reportados en tiempo real
- **Performance:** Trace de requests lentos
- **Releases:** Asocia errores con deploys específicos

---

## 🔗 Links Útiles

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Sentry Vercel Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [Supabase Vercel Integration](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

---

## 📝 Notas

- **Production domain:** `noddo.io` (configurar en Vercel → Domains)
- **Preview domains:** `*.vercel.app` (automático)
- **Branch deployments:** Cada PR genera preview automático
- **Rollback:** Vercel permite rollback instantáneo a cualquier deployment anterior
