# NODDO — Guía de Replicación Completa

Documento autocontenido para levantar el entorno completo de desarrollo de NodDo en otra máquina. Cubre stack técnico, Claude Code (plugins, MCP servers, skills, memory), variables de entorno, y pasos cronológicos.

---

## 1. Pre-requisitos del sistema

Instalar en la máquina nueva, en este orden:

```bash
# Node.js 24 LTS (default de Vercel)
# Windows: usar nvm-windows o descargar desde nodejs.org
# Mac/Linux: nvm install 24 && nvm use 24

# Git
# Windows: https://git-scm.com/download/win
# Mac: brew install git
# Linux: sudo apt install git

# Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Vercel CLI (para deploys, env pull, logs)
npm install -g vercel

# Playwright browsers (opcional, para tests e2e)
npx playwright install
```

Verificar:
```bash
node --version    # v24.x.x
git --version
claude --version  # Claude Code
vercel --version
```

---

## 2. Stack del proyecto

### Framework core
- **Next.js 16.1.6** — App Router
- **React 19.2.3**
- **TypeScript 5** — strict mode, no `any`
- **Tailwind CSS 4** — `@tailwindcss/postcss`, `@tailwindcss/typography`

### Data / Auth
- `@supabase/ssr`, `@supabase/supabase-js` — DB + Auth
- `@tanstack/react-query 5` + devtools — data fetching con optimistic updates
- `@upstash/ratelimit`, `@upstash/redis` — rate limiting en API routes

### Storage
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` — Cloudflare R2 (S3-compatible)

### UI
- `framer-motion 12` — animaciones, transiciones, scroll
- `lucide-react` — iconos (~1500)
- `swiper 12` — carruseles
- `cmdk 1` — command palette (Cmd+K)
- `@studio-freight/react-lenis`, `lenis` — smooth scroll
- `@paper-design/shaders-react` — shaders GLSL
- `class-variance-authority`, `clsx`, `tailwind-merge` — variantes de clases
- `react-parallax-tilt` — efecto tilt 3D
- `react-use-measure` — observar tamaños

### Editor de contenido
- `@tiptap/react`, `@tiptap/starter-kit` + extensions (image, link, placeholder, youtube)

### Media
- `sharp` — optimización de imágenes server-side
- `mapbox-gl 3` — mapas satellitales con POIs
- `@ffmpeg/ffmpeg`, `@ffmpeg/util` — procesamiento de video client-side
- `browser-image-compression` — compresión antes de upload
- `react-easy-crop` — recorte de imágenes

### PDF / Documentos
- `@react-pdf/renderer` — generación de cotizaciones PDF
- `jspdf`, `react-pdf` — lectura/embed de PDFs
- `pptxgenjs` — generación de presentaciones
- `xlsx`, `jszip` — Excel + archivos comprimidos

### Email / Auth
- `resend` — envío de emails transaccionales
- `react-google-recaptcha-v3` — captcha en forms públicos

### Monitoring
- `@sentry/nextjs` — error tracking

### Charts
- `recharts` — dashboard analytics

### Dev tooling
- `@playwright/test` — tests e2e
- `eslint 9`, `eslint-config-next`
- `tsx` — run TypeScript scripts
- `dotenv`, `cross-env`

### Scripts npm clave
```bash
npm run dev           # dev server
npm run dev:restart   # safe restart (scripts/safe-restart-dev.js)
npm run dev:clean     # rm -rf .next && npm run dev
npm run build         # production build (Turbopack)
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run db:migrate    # npx supabase db push
npm run test:e2e      # Playwright tests
npm run security:full # audit + lint + typecheck
```

### Instalación del stack

```bash
git clone <repo-url> NODDO
cd NODDO
npm install
```

---

## 3. Claude Code — Plugins instalados

12 plugins activos en `~/.claude/settings.json`. Instalar cada uno con el comando `/plugin` dentro de Claude Code.

| Plugin | Marketplace | Uso |
|---|---|---|
| `document-skills` | anthropic-agent-skills | DOCX / PDF / PPTX / XLSX skills |
| `example-skills` | anthropic-agent-skills | Skills de ejemplo (canvas, slides, etc.) |
| `frontend-design` | claude-plugins-official | Creación de UI distintiva |
| `code-review` | claude-plugins-official | Review de PRs |
| `github` | claude-plugins-official | Integración con GitHub |
| `playwright` | claude-plugins-official | Browser automation |
| `typescript-lsp` | claude-plugins-official | TS language server |
| `claude-code-setup` | claude-plugins-official | Helpers de config |
| `superpowers` | claude-plugins-official | TDD, debugging, planning, git worktrees |
| `code-simplifier` | claude-plugins-official | Cleanup de código |
| `skill-creator` | claude-plugins-official | Crear nuevos skills |
| `vercel` | claude-plugins-official | Deploy, env, CI/CD |

### Instalación

En Claude Code, ejecutar:
```
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
/plugin install frontend-design@claude-plugins-official
/plugin install code-review@claude-plugins-official
/plugin install github@claude-plugins-official
/plugin install playwright@claude-plugins-official
/plugin install typescript-lsp@claude-plugins-official
/plugin install claude-code-setup@claude-plugins-official
/plugin install superpowers@claude-plugins-official
/plugin install code-simplifier@claude-plugins-official
/plugin install skill-creator@claude-plugins-official
/plugin install vercel@claude-plugins-official
```

O directamente habilitarlos editando `~/.claude/settings.json`:
```json
{
  "enabledPlugins": {
    "document-skills@anthropic-agent-skills": true,
    "example-skills@anthropic-agent-skills": true,
    "frontend-design@claude-plugins-official": true,
    "code-review@claude-plugins-official": true,
    "github@claude-plugins-official": true,
    "playwright@claude-plugins-official": true,
    "typescript-lsp@claude-plugins-official": true,
    "claude-code-setup@claude-plugins-official": true,
    "superpowers@claude-plugins-official": true,
    "code-simplifier@claude-plugins-official": true,
    "skill-creator@claude-plugins-official": true,
    "vercel@claude-plugins-official": true
  }
}
```

---

## 4. Claude Code — MCP Servers

13 servers configurados globalmente en `~/.claude/settings.json` → `mcpServers`. Reemplazar `<YOUR_TOKEN>` con los tokens reales.

```json
{
  "mcpServers": {
    "supabase": {
      "serverUrl": "https://mcp.supabase.com/mcp?project_ref=voheghxhvkcyhlutmckl",
      "headers": { "Authorization": "Bearer <SUPABASE_ACCESS_TOKEN>" }
    },
    "vercel": {
      "serverUrl": "https://mcp.vercel.com",
      "headers": { "Authorization": "Bearer <VERCEL_API_TOKEN>" }
    },
    "cloudflare-api": {
      "serverUrl": "https://mcp.cloudflare.com/mcp"
    },
    "sentry": {
      "serverUrl": "https://mcp.sentry.dev/mcp",
      "headers": { "Authorization": "Bearer <SENTRY_TOKEN>" }
    },
    "gohighlevel": {
      "serverUrl": "https://services.leadconnectorhq.com/mcp/",
      "headers": {
        "Authorization": "Bearer <GHL_PIT_TOKEN>",
        "locationId": "<GHL_LOCATION_ID>"
      }
    },
    "brevo": {
      "serverUrl": "https://mcp.brevo.com/v1/brevo/mcp",
      "headers": { "Authorization": "Bearer <BREVO_TOKEN>" }
    },
    "stitch": {
      "serverUrl": "https://stitch.googleapis.com/mcp",
      "headers": { "X-Goog-Api-Key": "<GOOGLE_API_KEY>" }
    },
    "meta-ads": {
      "command": "meta-ads-mcp",
      "env": { "META_ACCESS_TOKEN": "<META_TOKEN>" }
    },
    "salesforce": {
      "command": "npx",
      "args": ["-y", "@tsmztech/mcp-server-salesforce"],
      "env": { "SALESFORCE_CONNECTION_TYPE": "Salesforce_CLI" }
    },
    "respond-io": {
      "command": "npx",
      "args": ["-y", "@respond-io/mcp-server"],
      "env": {
        "RESPONDIO_API_KEY": "<RESPONDIO_TOKEN>",
        "MCP_SERVER_MODE": "stdio"
      }
    },
    "rapidapi-facebook-ads": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.rapidapi.com",
        "--header", "x-api-host: facebook-ads-scraper.p.rapidapi.com",
        "--header", "x-api-key: <RAPIDAPI_KEY>"
      ]
    },
    "shopify": {
      "command": "npx",
      "args": ["-y", "shopify-mcp"],
      "env": {
        "SHOPIFY_ACCESS_TOKEN": "<SHOPIFY_TOKEN>",
        "MYSHOPIFY_DOMAIN": "<tienda>.myshopify.com"
      }
    },
    "shopify-dev": {
      "command": "npx",
      "args": ["-y", "@shopify/dev-mcp"]
    },
    "google-analytics": {
      "command": "npx",
      "args": ["-y", "@toolsdk.ai/google-analytics-mcp"],
      "env": { "GOOGLE_CREDENTIALS": "<JSON_SERVICE_ACCOUNT>" }
    }
  }
}
```

| Server | Propósito |
|---|---|
| supabase | DB/migrations/auth config de NodDo |
| vercel | Deployments, env, logs |
| cloudflare-api | DNS noddo.io, R2 buckets |
| sentry | Errores en producción |
| gohighlevel | CRM (otros negocios) |
| brevo | Email/SMS marketing |
| stitch | Google design tool |
| meta-ads, rapidapi-facebook-ads | Ads management y scraping |
| salesforce | CRM enterprise |
| respond-io | Messaging unificado |
| shopify, shopify-dev | E-commerce |
| google-analytics | Analytics GA4 |

---

## 5. User Skills personalizados

~30 skills custom viven en `~/.claude/skills/`. Transferirlos todos con:

```bash
# Desde máquina origen
rsync -av --delete ~/.claude/skills/ user@destino:~/.claude/skills/

# O copiar zipeado
tar -czf skills.tar.gz -C ~/.claude skills
# mover el tarball a nueva máquina
tar -xzf skills.tar.gz -C ~/.claude/
```

Windows (PowerShell):
```powershell
Compress-Archive -Path "$env:USERPROFILE\.claude\skills\*" -DestinationPath skills.zip
# copiar skills.zip a nueva máquina
Expand-Archive -Path skills.zip -DestinationPath "$env:USERPROFILE\.claude\skills"
```

### Categorías

**NodDo específicos:**
- `noddo-marketing-design` — Design language para marketing site
- `noddo-ghl` — Workflows GHL para NodDo

**Marketing / Ads:**
- `ad-copy-writer` — Generar Meta Ads copy
- `ad-swipe-generator` — Reverse-engineer ads con FAL AI
- `ad-swipe-machine` — Higgsfield version
- `meta-ad-uploader` — Upload de ads a Meta
- `meta-ads-auditor` — Audit de campañas
- `meta-ads-manager` — Ciclos de 5 días
- `video-ad-uploader` — Videos con Gemini + Meta
- `mm-copywriting`, `dxb-prime-ads` — Copy para otros negocios
- `copywriting`, `copywriting-humano` — General

**Scraping / Research:**
- `firecrawl` + 9 variantes: `-agent`, `-build-interact`, `-build-onboarding`, `-build-scrape`, `-build-search`, `-crawl`, `-download`, `-interact`, `-map`, `-scrape`, `-search`

**GoHighLevel:**
- `ghl-calendar`, `ghl-contacts`, `ghl-conversations`, `ghl-opportunities`, `ghl-social-blogs`

**Email:**
- `email-marketing`, `instantly`

**Design / UI:**
- `hue` — Meta-skill para generar design languages
- `restful-design` — Design system Restful
- `ui-ux-pro-max` — UI/UX intelligence
- `tailwind-css-patterns` — Tailwind patterns

**Utilidades:**
- `seo-audit`
- `weasyprint-pdf` — PDFs desde HTML/CSS
- `nano-banana` — Image generation
- `supabase-postgres-best-practices`
- `skill-creator` — Crear nuevos skills

---

## 6. Claude Code — Settings globales

En `~/.claude/settings.json`, al nivel raíz:

```json
{
  "effortLevel": "max",
  "autoUpdatesChannel": "latest",
  "skipDangerousModePermissionPrompt": true
}
```

---

## 7. Variables de entorno

Ver `.env.example` en el root del repo para la lista completa con comentarios. Crear `.env.local` (gitignored) con los valores reales.

### Críticas (sin ellas no arranca)

| Variable | Dónde obtenerla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | idem (secreto) |
| `SUPABASE_ACCESS_TOKEN` | Supabase account → Access Tokens |
| `VERCEL_API_TOKEN` | Vercel → Settings → Tokens |
| `AUTH_BEARER_TOKEN` | alias de `VERCEL_API_TOKEN` |
| `VERCEL_TEAM_ID` | `team_IObStg4131YUnI2axx7lMbDc` |
| `VERCEL_PROJECT_ID` | `prj_PQCHDGbraWsxbuRFgJjYl3TWxdHc` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox dashboard |
| `RESEND_API_KEY` | Resend dashboard |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Cloudflare R2 → Manage R2 API Tokens |
| `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Bucket principal |
| `R2_MEDIA_BUCKET_NAME`, `R2_MEDIA_PUBLIC_URL` | Bucket media |
| `NEXT_PUBLIC_R2_TOURS_URL` | URL pública de tours 360 |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash dashboard |
| `CRON_SECRET` | Random string (lo usas tú para cron auth) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `noddo.io` |

### Opcionales (features específicos)

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Error tracking |
| `EXCHANGERATE_API_KEY` | Currency conversion |
| `GOOGLE_GEMINI_API_KEY` | AI features |
| `META_CAPI_ACCESS_TOKEN`, `NEXT_PUBLIC_META_PIXEL_ID` | Meta Conversion API |
| `NEXT_PUBLIC_CRISP_WEBSITE_ID` | Chat widget |

### Opción rápida: `vercel env pull`

Si la nueva máquina está linkeada al proyecto Vercel:
```bash
vercel link
vercel env pull .env.local
```
Esto descarga todas las vars de Vercel a `.env.local` automáticamente.

---

## 8. Memory del proyecto

Los archivos de memoria persistente de NodDo viven en:
```
~/.claude/projects/c--Users-Juan-Documents-ANTIGRAVITY-NODDO/memory/
```

### Archivos a transferir

| Archivo | Contenido |
|---|---|
| `MEMORY.md` | Índice (siempre cargado) |
| `user_noddo_account.md` | Info del usuario |
| `branding.md` | Paleta de colores, fuentes, logos |
| `dependencies_mapped.md` | Impacto de cambios de schema |
| `dev_restart_script.md` | Safe dev restart |
| `scroll-animations.md` | Reglas de animaciones scroll-driven |
| `reference_supabase_token.md` | Supabase Management API token |
| `feedback_build_before_push.md` | Siempre `npm run build` antes de push |
| `feedback_dev_server_restart.md` | Nunca taskkill node.exe |
| `feedback_vercel_deploys.md` | Verificar build tras push |

### Transferir

```bash
# Mac/Linux
rsync -av ~/.claude/projects/c--Users-Juan-Documents-ANTIGRAVITY-NODDO/memory/ \
  user@destino:~/.claude/projects/c--Users-Juan-Documents-ANTIGRAVITY-NODDO/memory/
```

```powershell
# Windows
$src = "$env:USERPROFILE\.claude\projects\c--Users-Juan-Documents-ANTIGRAVITY-NODDO\memory"
$dst = "<path-a-nueva-maquina>\.claude\projects\c--Users-Juan-Documents-ANTIGRAVITY-NODDO\memory"
Copy-Item -Recurse $src $dst
```

⚠️ La ruta del proyecto en la nueva máquina debe ser exactamente `C:\Users\<User>\Documents\ANTIGRAVITY\NODDO` para que Claude Code la reconozca. Si cambias la ruta, el nombre del directorio de memory cambia también.

---

## 9. CLAUDE.md del proyecto

Ya vive versionado en el root del repo (`CLAUDE.md`). Se clona automáticamente con `git clone`. Contiene:
- Instrucciones específicas del proyecto
- Design system (surfaces, glassmorphism, fuentes)
- Arquitectura de rutas (dashboard vs microsite)
- Convenciones de código

---

## 10. Servicios externos (cuentas requeridas)

Checklist de cuentas a tener acceso:

- [ ] **Supabase** — proyecto `voheghxhvkcyhlutmckl`
- [ ] **Vercel** — team `team_IObStg4131YUnI2axx7lMbDc`, project `prj_PQCHDGbraWsxbuRFgJjYl3TWxdHc`
- [ ] **Cloudflare** — dominio `noddo.io` + R2 buckets (`media`, principal)
- [ ] **Resend** — sending domain `noddo.io` verificado
- [ ] **Mapbox** — token público
- [ ] **Upstash Redis** — database
- [ ] **Sentry** — org + project (opcional)
- [ ] **GitHub** — repo NODDO (privado)
- [ ] **Dominio noddo.io** — registrado y apuntando a Cloudflare

Opcionales (según features):
- [ ] Google AI Studio — Gemini
- [ ] Meta Business — Pixel + CAPI
- [ ] Crisp — chat widget
- [ ] exchangerate-api.com

---

## 11. Pasos de replicación (orden cronológico)

```bash
# 1. Instalar prerequisitos (ver Sección 1)
# Node 24, Git, Claude Code, Vercel CLI

# 2. Clonar repo
git clone <url-del-repo> NODDO
cd NODDO

# 3. Instalar deps
npm install

# 4. Configurar env vars
# Opción A: copiar .env.local del PC original
# Opción B:
cp .env.example .env.local
# llenar cada variable manualmente
# Opción C: si Vercel está linkeado
vercel link
vercel env pull .env.local

# 5. Habilitar plugins de Claude Code (ver Sección 3)
# Editar ~/.claude/settings.json → enabledPlugins

# 6. Configurar MCP servers (ver Sección 4)
# Editar ~/.claude/settings.json → mcpServers

# 7. Copiar user skills (ver Sección 5)
# rsync ~/.claude/skills/ o tar.gz

# 8. Copiar memory del proyecto (ver Sección 8)
# rsync ~/.claude/projects/c--Users-Juan-Documents-ANTIGRAVITY-NODDO/memory/

# 9. Verificar build
npm run build

# 10. Levantar dev server
npm run dev
```

Si todos los pasos pasan, la máquina está lista para desarrollar NodDo con el mismo entorno.

---

## Verificación final

- [ ] `npm run build` termina sin errores
- [ ] `npm run dev` arranca en http://localhost:3000
- [ ] Claude Code muestra los 12 plugins habilitados (`/plugin list`)
- [ ] MCP servers responden (prueba con `supabase` → listar proyectos)
- [ ] Skills disponibles via Skill tool
- [ ] Memory cargada: `MEMORY.md` visible en el index
