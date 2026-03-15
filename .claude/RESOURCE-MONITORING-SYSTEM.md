# 📊 Sistema de Monitoreo de Recursos - NODDO

## Descripción General

Sistema automatizado que monitorea el uso de recursos de todos los servicios de NODDO y envía reportes semanales por email con alertas proactivas cuando se acercan los límites.

---

## 🎯 Objetivos

1. **Prevenir interrupciones**: Detectar límites antes de que se alcancen
2. **Optimizar costos**: Identificar cuándo es momento de upgrade vs optimización
3. **Visibilidad completa**: Un solo reporte con todas las métricas importantes
4. **Acción proactiva**: Alertas tempranas con recomendaciones específicas

---

## 📅 Programación

### Reporte Semanal
- **Cuándo**: Todos los lunes a las 8:00 AM (hora Colombia)
- **Cron**: `0 13 * * 1` (UTC)
- **Endpoint**: `/api/cron/weekly-resource-report`
- **Destinatario**: Email configurado en `ADMIN_EMAIL`

---

## 🔍 Servicios Monitoreados

### 1. **Vercel**

| Métrica | Límite Hobby | Estado Critical | Estado Warning |
|---------|--------------|-----------------|----------------|
| Serverless Functions | 100,000/mes | >80,000 | >60,000 |
| Bandwidth | 100 GB/mes | >80 GB | >60 GB |
| Build Time | 6,000 min/mes | >4,800 min | >3,600 min |

**Recomendaciones automáticas:**
- **Critical**: Upgrade a Pro ($20/mes) o reducir uso
- **Warning**: Optimizar assets o monitorear de cerca

### 2. **Supabase**

| Métrica | Límite Free | Estado Critical | Estado Warning |
|---------|-------------|-----------------|----------------|
| Database Size | 500 MB | >400 MB | >300 MB |
| Storage | 1 GB | >800 MB | >600 MB |
| Connections | ~60 | >50 | >40 |

**Recomendaciones automáticas:**
- **Critical**: Upgrade URGENTE a Pro ($25/mes)
- **Warning**: Limpiar datos antiguos o optimizar queries

### 3. **Upstash Redis**

| Métrica | Límite Free | Estado Critical | Estado Warning |
|---------|-------------|-----------------|----------------|
| Commands | 10,000/día | >8,000 | >6,000 |
| Memory | Variable | >80% | >60% |

**Recomendaciones automáticas:**
- **Critical**: Upgrade a Pay-as-you-go
- **Warning**: Limpiar keys antiguas o optimizar cacheo

### 4. **Resend**

| Métrica | Límite Free | Estado Critical | Estado Warning |
|---------|-------------|-----------------|----------------|
| Emails | 3,000/mes | >2,500 | >2,000 |

**Recomendaciones automáticas:**
- **Critical**: Upgrade a Pro ($20/mes para 50K)
- **Warning**: Monitorear envíos cuidadosamente

---

## 📧 Formato del Reporte

### Email HTML con:

**1. Resumen Ejecutivo**
- Contador visual: Safe / Warning / Critical
- Alerta destacada si hay problemas críticos

**2. Detalles por Servicio**
- Barra de progreso visual con colores
- Uso actual vs límite
- Porcentaje de utilización
- Recomendaciones específicas

**3. Acciones Recomendadas**
- Lista priorizada de acciones
- Links a dashboards relevantes
- Indicación de urgencia

---

## 🚨 Niveles de Alerta

### ✅ Safe (Verde)
- Uso < 60% del límite
- No requiere acción
- Todo operando normalmente

### ⚠️ Warning (Amarillo)
- Uso entre 60-80% del límite
- Monitorear de cerca
- Considerar optimizaciones

### 🚨 Critical (Rojo)
- Uso > 80% del límite
- **Acción inmediata requerida**
- Upgrade o optimización urgente

El **subject del email** cambia según el peor estado:
- `✅ Todo en Orden` → Ninguna alerta
- `⚠️ Advertencia` → Al menos 1 warning
- `🚨 URGENTE` → Al menos 1 critical

---

## 🔐 Seguridad

### Autenticación del Cron
```typescript
Authorization: Bearer ${CRON_SECRET}
```

**Configuración:**
1. Generar secret: `openssl rand -base64 32`
2. Agregar a Vercel: `CRON_SECRET=tu_secret_aqui`
3. Vercel automáticamente agrega el header en cron jobs

### Variables de Entorno Requeridas

```bash
# Core (obligatorias)
ADMIN_EMAIL=tu-email@aqui.com
RESEND_API_KEY=re_xxx
CRON_SECRET=tu_secret_aqui

# Vercel (para métricas)
VERCEL_API_TOKEN=xxx
VERCEL_PROJECT_ID=prj_xxx
VERCEL_TEAM_ID=team_xxx  # Solo si usas team

# Supabase (ya configurado)
NEXT_PUBLIC_SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Upstash (opcional - para métricas de Redis)
UPSTASH_API_TOKEN=xxx
UPSTASH_EMAIL=xxx
```

---

## 🛠️ Configuración Inicial

### Paso 1: Variables de Entorno

```bash
# En Vercel Dashboard:
# Settings → Environment Variables

# 1. Generar y agregar CRON_SECRET
echo "CRON_SECRET=$(openssl rand -base64 32)"

# 2. Configurar ADMIN_EMAIL
ADMIN_EMAIL=tu-email-real@gmail.com

# 3. Agregar Upstash API (opcional)
# Desde: https://console.upstash.com/account/api
UPSTASH_API_TOKEN=xxx
UPSTASH_EMAIL=xxx
```

### Paso 2: Aplicar Migración

```bash
npx supabase db push
# Aplica: 20260415000012_email_logs.sql
```

### Paso 3: Deploy

```bash
git add -A
git commit -m "feat: add weekly resource monitoring system"
git push origin main
```

Vercel automáticamente configurará el cron job.

### Paso 4: Prueba Manual

```bash
# Desde tu terminal local:
curl -X GET "https://noddo.io/api/cron/weekly-resource-report" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

Deberías recibir el email en ~30 segundos.

---

## 📊 Ejemplo de Reporte

```
┌─────────────────────────────────────────────┐
│  📊 Reporte Semanal de Recursos - NODDO     │
│  Lunes, 15 de marzo de 2026, 8:00 AM       │
└─────────────────────────────────────────────┘

┌─────────┬─────────┬─────────┐
│ ✅ SAFE │ ⚠️ WARN │ 🚨 CRIT │
│    8    │    2    │    1    │
└─────────┴─────────┴─────────┘

🚨 Atención Urgente Requerida
Hay 1 servicio en estado crítico que requiere acción inmediata.

📈 Detalle de Recursos:

🚨 Supabase Database ────────────── 85%
[████████████████████░░] 425 MB de 500 MB
⚠️ URGENTE: Database cerca del límite. Upgrade a Pro ($25/mes)

⚠️ Vercel Serverless Functions ──── 72%
[██████████████░░░░░░] 72,000 de 100,000 invocations/month
Monitorear de cerca, acercándose al límite

✅ Vercel Bandwidth ───────────── 35%
[███████░░░░░░░░░░░░] 35 GB de 100 GB/month

... (resto de métricas)

🎯 Acciones Recomendadas:
• [URGENTE] Revisar y resolver 1 alerta crítica
• [PRONTO] Monitorear 2 servicios en advertencia
• Revisar Supabase Dashboard para optimizaciones
```

---

## 🔄 Mantenimiento

### Actualizar Límites
Si cambias de plan, actualiza los límites en:
- `src/app/api/cron/weekly-resource-report/route.ts`

### Agregar Nuevos Servicios
1. Crear función `getXxxxMetrics()`
2. Agregar a `Promise.all()` en el endpoint
3. Definir límites y thresholds

### Modificar Frecuencia
```json
// vercel.json
"schedule": "0 13 * * 1"  // Lunes 8 AM Colombia
//          │  │  │ │ │
//          │  │  │ │ └─ Día de la semana (1=Lunes)
//          │  │  │ └─── Mes
//          │  │  └───── Día del mes
//          │  └──────── Hora (UTC)
//          └─────────── Minuto
```

**Ejemplos:**
- Diario: `0 13 * * *`
- Quincenal: `0 13 1,15 * *`
- Mensual: `0 13 1 * *`

---

## 🐛 Troubleshooting

### No llega el email

**1. Verificar logs de Vercel**
```bash
vercel logs --follow
# Buscar: "weekly resource report"
```

**2. Verificar Resend Dashboard**
- https://resend.com/emails
- Buscar emails del día
- Revisar bounces/failures

**3. Verificar ADMIN_EMAIL**
```bash
# En Vercel Dashboard:
# Settings → Environment Variables → ADMIN_EMAIL
```

### Email llega a spam

**Soluciones:**
1. Configurar SPF/DKIM en Resend
2. Marcar como "No es spam" en Gmail
3. Agregar noreply@noddo.io a contactos

### Métricas incorrectas

**Revisar:**
1. Tokens de API válidos
2. Permisos de las APIs
3. Límites actualizados según tu plan

---

## 📚 Referencias

- **Vercel API**: https://vercel.com/docs/rest-api
- **Supabase Management**: https://supabase.com/docs/reference/javascript/admin-api
- **Upstash API**: https://upstash.com/docs/redis/overall/getstarted
- **Resend API**: https://resend.com/docs/api-reference/emails/send-email

---

## ✅ Checklist de Implementación

- [x] Endpoint `/api/cron/weekly-resource-report` creado
- [x] Cron configurado en `vercel.json`
- [x] Migración `email_logs` creada
- [x] Variables de entorno en `.env.example`
- [ ] Variables configuradas en Vercel
- [ ] Migración aplicada a Supabase
- [ ] Deploy a producción
- [ ] Prueba manual del endpoint
- [ ] Email recibido correctamente

---

**Última actualización:** 2026-03-15
**Autor:** Claude Sonnet 4.5
**Estado:** ✅ Listo para producción
