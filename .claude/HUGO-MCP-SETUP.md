# 🤖 Hugo AI + MCP Integration - Guía Completa

## 🎯 ¿Qué es esto?

Hugo AI ahora puede acceder a **datos en tiempo real** de NODDO vía MCP (Model Context Protocol):

- ✅ Consultar proyectos (ubicación, tipologías, precios)
- ✅ Verificar disponibilidad de unidades
- ✅ Buscar en FAQs automáticamente
- ✅ Crear leads cuando usuarios quieren ser contactados
- ✅ Acceder a artículos de ayuda completos

**Todo sin re-entrenar** — Hugo siempre tiene datos actualizados.

---

## 📦 Archivos Creados

```
NODDO/
├── mcp-server/
│   ├── src/index.ts           # MCP server con 5 tools
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md              # Documentación técnica
│   └── .env.example
│
├── scripts/
│   └── setup-mcp-server.sh    # Script automático de setup
│
└── scripts/hugo-training/
    ├── noddo-faq.md           # 100+ FAQs
    ├── noddo-quick-start.md   # Guía de inicio
    └── HUGO-TRAINING-GUIDE.md # Instrucciones de entrenamiento
```

---

## 🚀 Setup Rápido (10 minutos)

### **Paso 1: Instalar y Configurar MCP Server** (3 min)

```bash
# Desde el root de NODDO
cd mcp-server

# Instalar dependencias
npm install

# Copiar .env.example a .env
cp .env.example .env
```

Edita `mcp-server/.env` y completa con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (tu service role key)
```

**⚠️ IMPORTANTE**: Usa el **SERVICE ROLE KEY**, NO el anon key. El service role tiene acceso completo a la DB.

> 💡 **Tip**: Las credenciales están en tu `.env.local` principal

---

### **Paso 2: Iniciar MCP Server** (1 min)

```bash
# Desde mcp-server/
npm run dev
```

Deberías ver:

```
NODDO MCP Server running on stdio
```

**Mantén esta terminal abierta** ✅

---

### **Paso 3: Crear Tunnel Público** (2 min)

En **otra terminal**:

```bash
# Instalar Cloudflare Tunnel (solo primera vez)
npm install -g cloudflared

# Crear tunnel público
npx cloudflared tunnel --url http://localhost:3001
```

Verás algo como:

```
2026-03-15 10:30:45 INF  Your quick Tunnel has been created!
URL: https://abc-xyz-123.trycloudflare.com
```

**Copia esa URL** 📋 (la necesitas para el siguiente paso)

**Mantén esta terminal abierta también** ✅

---

### **Paso 4: Configurar en Crisp (Hugo)** (4 min)

1. **Login a Crisp**: https://app.crisp.chat/
2. **Ir a AI Agent**:
   - Sidebar izquierda → "AI Agent" (ícono de robot)
3. **Configurar MCP**:
   - Tab "Automate"
   - Click "MCP & Integrations"
   - Click "External MCP servers"
   - Click "+ Add server"
4. **Pegar URL del tunnel**:
   - Server URL: `https://abc-xyz-123.trycloudflare.com` (tu URL)
   - Name: "NODDO MCP Server"
   - Click "Save"

**¡Listo!** Hugo ahora tiene acceso a tus datos 🎉

---

## 🧪 Probar la Integración

### Test 1: Consultar un proyecto

En el chat de Hugo (en tu sitio):

```
Usuario: "¿Qué proyectos tienen disponibles?"
Hugo: [Ejecuta search_faqs o get_project_info]
```

### Test 2: Verificar disponibilidad

```
Usuario: "¿Cuántas unidades disponibles hay en Ciudadela Senderos?"
Hugo: [Ejecuta check_unit_availability]
Hugo: "📊 Disponibilidad actual:
       - Disponibles: 12
       - Reservadas: 3
       - Vendidas: 5
       - Total unidades: 20"
```

### Test 3: Crear lead

```
Usuario: "Quiero agendar una visita"
Hugo: "Perfecto! ¿Cuál es tu nombre?"
Usuario: "Juan Pérez"
Hugo: "¿Tu email?"
Usuario: "juan@example.com"
Hugo: [Ejecuta create_lead]
Hugo: "✅ Listo Juan! Un asesor se contactará pronto al juan@example.com"
```

---

## 🛠️ Tools Disponibles en Hugo

### 1. `search_faqs`
Busca en las 100+ preguntas frecuentes de NODDO.

**Cuándo se usa**: Usuario pregunta "¿Cómo publico mi proyecto?", "¿Cómo subo imágenes?"

**Ejemplo de respuesta**:
```json
{
  "pregunta": "¿Cómo publico mi proyecto?",
  "respuesta": "Para publicar: 1) Editor → Configuración...",
  "categoria": "proyectos"
}
```

---

### 2. `get_project_info`
Obtiene información completa de un proyecto (ubicación, tipologías, precio).

**Cuándo se usa**: Usuario pregunta sobre un proyecto específico.

**Ejemplo de respuesta**:
```json
{
  "proyecto": {
    "nombre": "Ciudadela Senderos",
    "ubicacion_ciudad": "Bogotá",
    "descripcion": "...",
    "whatsapp_numero": "+57 300 123 4567"
  },
  "tipologias": [
    {
      "nombre": "Apartamento 2 Hab",
      "area": 65,
      "habitaciones": 2,
      "banos": 2,
      "precio_desde": 180000000
    }
  ]
}
```

---

### 3. `check_unit_availability`
Consulta disponibilidad de unidades en tiempo real.

**Cuándo se usa**: Usuario pregunta "¿Hay disponibles?", "¿Cuántas quedan?"

**Ejemplo de respuesta**:
```
📊 Disponibilidad actual:
- Disponibles: 12
- Reservadas: 3
- Vendidas: 5
- Total unidades: 20
```

---

### 4. `create_lead`
Crea un lead en Supabase cuando usuario quiere ser contactado.

**Cuándo se usa**: Usuario dice "Quiero agendar visita", "Contactarme", "Más información"

**Datos que captura**:
- Nombre
- Email
- Teléfono (opcional)
- Mensaje
- Proyecto de interés
- Origen: "hugo-ai-chat"

**Ejemplo de respuesta**:
```
✅ Lead creado exitosamente. Un asesor se contactará pronto con Juan al juan@example.com
```

---

### 5. `get_help_article`
Obtiene contenido completo de artículos de ayuda.

**Cuándo se usa**: Usuario pregunta algo muy específico que requiere tutorial completo.

**Categorías**:
- dashboard (proyectos, equipo, leads)
- proyecto (crear, editar, publicar)
- contenido (galería, videos, tours)
- ajustes (dominio, branding, integraciones)
- flujos (cotizador, calendario)

---

## 🔐 Seguridad

### ¿Es seguro?

✅ **Sí**. El MCP server:
- Usa `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- No expone credenciales al cliente
- Solo ejecuta las tools que defines
- Logs completos de cada acción

### ¿Hugo puede hacer cambios?

⚠️ **Parcialmente**:
- ✅ **Puede**: Crear leads (safe)
- ✅ **Puede**: Leer proyectos, tipologías, disponibilidad
- ❌ **NO puede**: Editar proyectos
- ❌ **NO puede**: Eliminar datos
- ❌ **NO puede**: Cambiar precios

Si quieres que Hugo pueda editar datos, agrega tools adicionales con validaciones.

---

## 📊 Monitoreo

### Ver logs en tiempo real

Mientras el MCP server corre (`npm run dev`), verás logs de cada llamada:

```
[MCP] Tool called: get_project_info
[MCP] Args: { project_slug: "ciudadela-senderos" }
[MCP] Result: { proyecto: {...}, tipologias: [...] }
```

### Ver leads creados por Hugo

```sql
-- En Supabase SQL Editor
SELECT *
FROM leads
WHERE origen = 'hugo-ai-chat'
ORDER BY created_at DESC;
```

---

## 🔄 Agregar Más Tools

¿Quieres que Hugo pueda hacer más cosas? Edita `mcp-server/src/index.ts`:

### Ejemplo: Tool para calcular financiación

```typescript
{
  name: "calculate_financing",
  description: "Calcula plan de financiación para una unidad",
  inputSchema: {
    type: "object",
    properties: {
      precio_unidad: { type: "number" },
      cuota_inicial_pct: { type: "number" },
      plazo_meses: { type: "number" },
      tasa_interes: { type: "number" }
    },
    required: ["precio_unidad"]
  }
}
```

Luego implementa el handler:

```typescript
case "calculate_financing": {
  const { precio_unidad, cuota_inicial_pct = 20, plazo_meses = 180, tasa_interes = 12 } = args;

  const cuota_inicial = precio_unidad * (cuota_inicial_pct / 100);
  const monto_financiar = precio_unidad - cuota_inicial;
  const tasa_mensual = (tasa_interes / 100) / 12;

  const cuota_mensual = monto_financiar *
    (tasa_mensual * Math.pow(1 + tasa_mensual, plazo_meses)) /
    (Math.pow(1 + tasa_mensual, plazo_meses) - 1);

  return {
    content: [{
      type: "text",
      text: `💰 Plan de financiación:
- Precio: $${precio_unidad.toLocaleString('es-CO')}
- Cuota inicial (${cuota_inicial_pct}%): $${cuota_inicial.toLocaleString('es-CO')}
- Monto a financiar: $${monto_financiar.toLocaleString('es-CO')}
- Cuota mensual: $${Math.round(cuota_mensual).toLocaleString('es-CO')}
- Plazo: ${plazo_meses} meses (${plazo_meses/12} años)
- Tasa: ${tasa_interes}% anual`
    }]
  };
}
```

Rebuild: `npm run build` → Hugo detecta la nueva tool automáticamente 🎉

---

## 🆘 Troubleshooting

### Hugo no ve las tools

**Posibles causas**:
1. MCP server no está corriendo → `npm run dev`
2. Tunnel cerrado → Verifica que cloudflared esté activo
3. URL incorrecta en Crisp → Pega la URL del tunnel completa

**Fix**: Restart todo (MCP server + tunnel) y reconfigura en Crisp.

---

### Error: "Tool execution failed"

**Causa**: Probablemente error de Supabase (credentials o tabla no existe).

**Fix**:
1. Verifica `.env` en `mcp-server/`
2. Verifica que `SUPABASE_SERVICE_ROLE_KEY` sea correcta (no anon key)
3. Check logs del MCP server para ver error específico

---

### Hugo responde lento

**Causa**: El MCP server está haciendo queries complejas a Supabase.

**Fix**:
- Optimiza queries (agrega índices en Supabase)
- Cache resultados frecuentes (implementa Redis en el MCP server)

---

### Tunnel se cae cada hora

**Causa**: Cloudflare free tunnel expira.

**Fix**: Deploy el MCP server a producción:
- **Opción A**: Vercel Serverless Functions
- **Opción B**: Railway.app (gratis con limits)
- **Opción C**: Cloudflare Workers (free tier generoso)

---

## 🚀 Deploy a Producción

### Opción A: Railway.app (Recomendado - Gratis)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd mcp-server
railway init
railway up
```

Railway te da una URL permanente: `https://tu-app.railway.app`

Configura esa URL en Crisp (ya no necesitas tunnel).

---

### Opción B: Vercel Serverless

Convierte el MCP server en API routes de Next.js:

```typescript
// src/app/api/mcp/route.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// ... mismo código del MCP server
```

Deploy: `vercel --prod`

URL: `https://noddo.vercel.app/api/mcp`

---

## 📈 Métricas de Éxito

Después de 1 semana con Hugo MCP:

**Verificar**:
- ✅ % de conversaciones resueltas sin humano (meta: >70%)
- ✅ Tiempo promedio de respuesta (meta: <5 segundos)
- ✅ Leads creados por Hugo (track en Supabase)
- ✅ Satisfacción usuario (Crisp CSAT score)

**Optimizar**:
- Si % resolución es bajo → Agregar más FAQs
- Si respuestas lentas → Optimizar queries o cache
- Si muchos leads spam → Agregar validaciones

---

## 🎓 Recursos

### Documentación Oficial

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [Hugo MCP Integration Guide](https://help.crisp.chat/en/article/how-to-build-mcp-integrations-with-hugo-tlrqmn/)
- [Crisp Hugo Knowledge Base](https://help.crisp.chat/en/category/hugo-ai-agent-chatbot-1yxt4vb/)

### Video Tutoriales

- [How MCP works](https://x.com/AIC_Hugo/status/1906698435761144232) (Twitter thread)
- [Hugo AI Demo](https://hugo.ai/en/)

---

## ✅ Checklist Final

Antes de activar en producción:

- [ ] MCP server instalado y corriendo
- [ ] Tunnel público funcionando (o deployado a producción)
- [ ] Configurado en Crisp → MCP & Integrations
- [ ] Probado las 5 tools con casos reales
- [ ] Hugo responde en <10 segundos
- [ ] Leads creados aparecen correctamente en Supabase
- [ ] Equipo capacitado en revisar leads de Hugo
- [ ] Logs de MCP server monitoreados

---

**¡Listo!** Hugo ahora es un asistente enterprise con acceso directo a NODDO 🚀

---

**Implementado**: 15 de Marzo, 2026
**Archivos creados**: 6
**Tiempo setup**: ~10 minutos
**Costo**: $0/mes (gratis con Cloudflare tunnel)
