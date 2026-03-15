# Setup Rápido - Solo Upstash Falta

## ✅ Ya Configurado (No toques nada)
- Sentry ✅
- React Query ✅
- Base de datos optimizada ✅
- Vercel builds ✅
- CI/CD ✅

## ⚠️ Solo Falta Esto (2 minutos)

### Paso 1: Crear base de datos Upstash
1. Abre: **https://console.upstash.com/**
2. Sign up (gratis, sin tarjeta)
3. Clic: **"Create Database"**
4. Configuración:
   - Name: `noddo`
   - Type: **Regional**
   - Region: **us-east-1** (o el más cercano)
   - Eviction: **No Eviction**
5. Clic: **"Create"**

### Paso 2: Copiar credenciales
En el dashboard de tu nueva base de datos, verás:
- **UPSTASH_REDIS_REST_URL**: `https://xxxxxx.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN**: `AXXXxxxxxxxxxxxxx`

### Paso 3: Ejecutar UN comando

Copia y pega esto (reemplaza con tus credenciales reales):

```bash
# Windows (Git Bash)
cat >> .env.local << 'EOF'

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://tu-url-real.upstash.io
UPSTASH_REDIS_REST_TOKEN=AtuTokenReal
EOF

# Sincronizar a Vercel
node scripts/sync-env-to-vercel.js
```

### Paso 4: Deploy
```bash
git add .
git commit -m "feat: add Upstash rate limiting"
git push
```

## ✅ Listo!

Ahora tienes:
- ✅ Monitoreo de errores (Sentry)
- ✅ BD ultra-rápida (índices optimizados)
- ✅ Caché inteligente (React Query)
- ✅ Protección contra abuso (Upstash rate limiting)
- ✅ Deployments estables
- ✅ Tests automáticos

## Verificar que funciona

```bash
# Debe responder OK
curl https://noddo.io/api/health

# Después del request 101, debe dar error 429
for i in {1..110}; do curl -s https://noddo.io/api/proyectos & done
```

## Límites configurados

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| API general | 100 req | 10 segundos |
| Login/signup | 5 req | 1 minuto |
| Lead forms | 3 req | 1 hora |
| Uploads | 20 req | 1 minuto |
| Emails | 10 req | 1 hora |

## ¿Dudas?

**¿Qué pasa si no configuro Upstash?**
La app funciona igual. Solo no tendrás protección contra spam/abuso.

**¿Cuánto cuesta?**
Gratis hasta 10,000 comandos/día (más que suficiente).

**¿Ya puedo hacer deploy sin Upstash?**
Sí, todo lo demás ya está funcionando perfecto.
