# NODDO MCP Server

MCP (Model Context Protocol) server que permite a Hugo AI acceder a datos en tiempo real de NODDO.

## 🎯 Funcionalidades

Hugo puede:
- ✅ Buscar en FAQs de NODDO
- ✅ Consultar información de proyectos (ubicación, tipologías, precios)
- ✅ Verificar disponibilidad de unidades
- ✅ Crear leads cuando usuarios quieren ser contactados
- ✅ Acceder a artículos de ayuda completos

## 🚀 Setup

### 1. Instalar dependencias

```bash
cd mcp-server
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y completa:

```bash
cp .env.example .env
```

Usa las mismas credenciales de Supabase que tienes en el `.env.local` principal:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (⚠️ service role, no anon key)

### 3. Compilar y ejecutar

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🌐 Conectar con Hugo

### Opción A: Tunnel público con Cloudflare

```bash
# Instalar Cloudflare Tunnel
npm install -g cloudflared

# Crear tunnel (mientras el server corre)
npm run tunnel
```

Esto te da una URL pública tipo: `https://xyz.trycloudflare.com`

### Opción B: Deploy a Vercel/Railway

Deploy el MCP server a un servicio con URL permanente.

### Configurar en Hugo

1. Ve a Crisp → AI Agent → Automate → MCP & Integrations
2. Click "External MCP servers"
3. Pega tu URL del tunnel: `https://xyz.trycloudflare.com`
4. Save

Hugo ahora puede usar las tools del MCP server 🎉

## 🛠️ Tools Disponibles

### `search_faqs`
Busca en preguntas frecuentes de NODDO.

**Ejemplo**:
```json
{
  "query": "cómo publico mi proyecto"
}
```

### `get_project_info`
Obtiene información completa de un proyecto.

**Ejemplo**:
```json
{
  "project_slug": "ciudadela-senderos"
}
```

### `check_unit_availability`
Consulta disponibilidad de unidades.

**Ejemplo**:
```json
{
  "project_slug": "ciudadela-senderos"
}
```

### `create_lead`
Crea un lead en Supabase.

**Ejemplo**:
```json
{
  "project_id": "uuid-del-proyecto",
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "+57 300 123 4567",
  "mensaje": "Quisiera más información sobre apartamentos de 3 habitaciones"
}
```

### `get_help_article`
Obtiene contenido de artículo de ayuda.

**Ejemplo**:
```json
{
  "category": "proyectos",
  "slug": "crear-proyecto"
}
```

## 🔐 Seguridad

- ⚠️ El MCP server usa `SUPABASE_SERVICE_ROLE_KEY` para acceso completo a la DB
- ✅ Hugo solo puede ejecutar las tools que defines
- ✅ Puedes agregar validaciones adicionales en cada tool
- ✅ Logs automáticos de todas las llamadas

## 📊 Monitoreo

Ver logs en tiempo real:

```bash
npm run dev
```

Cada vez que Hugo use una tool verás:
```
[MCP] Tool called: get_project_info
[MCP] Args: { project_slug: "ciudadela-senderos" }
[MCP] Result: { proyecto: {...}, tipologias: [...] }
```

## 🔄 Actualizar Tools

Para agregar nuevas funcionalidades:

1. Edita `src/index.ts`
2. Agrega la tool en `ListToolsRequestSchema`
3. Implementa el handler en `CallToolRequestSchema`
4. Rebuild: `npm run build`
5. Hugo detecta automáticamente las nuevas tools

## 🆘 Troubleshooting

### Hugo no puede conectarse al MCP server

- Verifica que el tunnel esté corriendo
- Verifica que la URL en Crisp sea correcta
- Check logs del MCP server

### Tools no aparecen en Hugo

- Verifica que el formato JSON de `tools` sea correcto
- Restart el MCP server
- Refresh la página de configuración de Hugo

### Errores de Supabase

- Verifica que `SUPABASE_SERVICE_ROLE_KEY` sea correcta
- Verifica que las tablas existan en Supabase
- Check RLS policies (service role bypasses RLS)

## 📚 Recursos

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [Hugo MCP Integration Docs](https://help.crisp.chat/en/article/how-to-build-mcp-integrations-with-hugo-tlrqmn/)
- [Crisp Knowledge Base](https://help.crisp.chat/en/category/hugo-ai-agent-chatbot-1yxt4vb/)
