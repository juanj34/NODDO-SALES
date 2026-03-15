# ⚡ Guía Rápida: Alertas Inmediatas (5 minutos)

**Email:** juanjaramillo34@gmail.com
**Configuración:** Alertas críticas por email + Digest diario automático

---

## ✅ Lo que ya está configurado

### 📧 Email Digest Diario (LISTO)
✅ Script creado: `/api/cron/daily-digest`
✅ Cron configurado: Todos los días a las 9:00 AM (hora Colombia)
✅ Vercel Cron: Activado en `vercel.json`
✅ Variables: CRON_SECRET configurada

**Recibirás cada mañana a las 9:00 AM:**
- Leads nuevos (últimas 24h con % de cambio)
- Proyectos publicados
- Errores recientes
- Uso de Upstash Redis (comandos, memoria, rate limiting)
- Links rápidos a todas las consolas

---

## 🚀 Configura las Alertas Inmediatas (5 min)

### 1️⃣ Sentry - Alertas de Errores Críticos

#### Paso 1: Abrir configuración
Abre este link: https://sentry.io/settings/noddo/projects/noddo-app/alerts/

#### Paso 2: Crear 2 alertas (2 minutos cada una)

**ALERTA #1: Errores Nuevos** 🔴

1. Click en **"Create Alert Rule"**
2. Selecciona: **"Issues"** → **"Errors"**
3. Configura:

```
Nombre: 🔴 Error Nuevo en Producción

WHEN (Cuándo disparar):
  ✅ A new issue is created
  ✅ Environment = production

THEN (Qué hacer):
  ✅ Send a notification via email
  ✅ To: juanjaramillo34@gmail.com
  ✅ Frequency: Immediately (no throttle)

Guardar: "Save Rule"
```

**ALERTA #2: Muchos Errores** 🚨

1. Click en **"Create Alert Rule"** de nuevo
2. Selecciona: **"Issues"** → **"Errors"**
3. Configura:

```
Nombre: 🚨 Spike de Errores (>50 en 1h)

WHEN (Cuándo disparar):
  ✅ The issue is seen more than 50 times in 1 hour
  ✅ Environment = production

THEN (Qué hacer):
  ✅ Send a notification via email
  ✅ To: juanjaramillo34@gmail.com
  ✅ Frequency: At most once every 30 minutes

Guardar: "Save Rule"
```

#### Paso 3: Habilitar Resumen Semanal (30 segundos)

1. Abre: https://sentry.io/settings/account/notifications/
2. Busca **"Weekly Reports"**
3. Habilita: ✅ **On** → Enviar a: juanjaramillo34@gmail.com
4. Guardar

---

### 2️⃣ Upstash - Alertas de Uso Alto

#### Paso 1: Abrir configuración
Abre este link: https://console.upstash.com/redis/d7364351-4963-49c6-a83d-c58a4c03c8da

#### Paso 2: Configurar alertas

1. Sidebar → Click en **"Settings"**
2. Scroll hasta **"Alerts"** o **"Notifications"**

**ALERTA #1: Memoria Alta** ⚠️

```
Trigger: Memory Usage > 80% (20 MB / 25 MB)
Email: juanjaramillo34@gmail.com
Mensaje personalizado: "⚠️ NODDO Redis usando más del 80% de memoria"
```

**ALERTA #2: Comandos Diarios Altos** ⚠️

```
Trigger: Daily Commands > 8000 (80% del límite)
Email: juanjaramillo34@gmail.com
Mensaje personalizado: "⚠️ NODDO cerca del límite de comandos diarios"
```

> **Nota:** Si Upstash no tiene estas opciones exactas, busca "Email Notifications" o "Monitoring" en el dashboard.

---

### 3️⃣ Vercel - Verificar Notificaciones (1 minuto)

#### Paso 1: Verificar configuración
Abre: https://vercel.com/juanj34s-projects/noddo/settings/notifications

#### Paso 2: Asegurar que estén activadas

```
✅ Production Deployments → Always notify
✅ Failed Deployments → Always notify
✅ Build Errors → Always notify
⚠️ Preview Deployments → Only on failure (evita spam)
```

#### Paso 3: Verificar email
Asegúrate que el email sea: **juanjaramillo34@gmail.com**

---

### 4️⃣ GitHub Actions - Verificar Notificaciones (30 seg)

#### Paso 1: Abrir configuración
Abre: https://github.com/settings/notifications

#### Paso 2: Verificar que esté activado

```
✅ Actions
  ✅ Send notifications for failed workflows only
  ✅ Email: juanjaramillo34@gmail.com
```

---

## 📊 Resumen de Emails que Recibirás

### 🌅 Diario (9:00 AM)
- **1 email:** Digest diario con todas las métricas resumidas

### 🚨 Inmediatos (cuando ocurran)
- **Errores nuevos** en producción (Sentry)
- **Spike de errores** (>50 en 1 hora)
- **Memoria Redis alta** (>80%)
- **Comandos diarios altos** (>8000)
- **Deploy fallido** (Vercel)
- **Tests fallidos** (GitHub Actions)

### 📅 Semanales (lunes)
- **1 email:** Resumen semanal de Sentry

### Total estimado
- **Normal:** 1-2 emails/día (digest + alguna alerta ocasional)
- **Con problemas:** 3-5 emails/día (digest + alertas críticas)
- **Sin actividad:** 8 emails/semana (solo digests + resumen semanal)

---

## ✅ Checklist de Configuración

- [ ] **Sentry:** Alerta de errores nuevos
- [ ] **Sentry:** Alerta de spike de errores
- [ ] **Sentry:** Resumen semanal habilitado
- [ ] **Upstash:** Alerta de memoria alta
- [ ] **Upstash:** Alerta de comandos altos
- [ ] **Vercel:** Notificaciones verificadas
- [ ] **GitHub:** Notificaciones verificadas
- [ ] **Probar:** Enviar email de prueba del digest

---

## 🧪 Probar el Digest Diario (Opcional)

Para probar que el digest funciona sin esperar hasta mañana:

```bash
# En tu terminal local
curl -X POST https://noddo.io/api/cron/daily-digest \
  -H "Authorization: Bearer 01156927d0134719b28a0da3194da8cac79a5894f00c9a9fb5d894446adfd247"
```

O simplemente espera hasta mañana a las 9:00 AM y lo recibirás automáticamente.

---

## 🎯 Siguiente Deploy

Cuando hagas `git push` de estos cambios:
1. ✅ Vercel desplegará automáticamente
2. ✅ El cron job se activará en producción
3. ✅ Mañana a las 9 AM recibirás tu primer digest
4. ✅ Las alertas inmediatas estarán activas desde ya

---

## 💡 Consejos

### Si recibes muchos emails
- Ajusta el threshold de Sentry a >100 errores en 1h
- Desactiva alertas de preview deployments en Vercel
- Configura reglas de Gmail para organizar automáticamente

### Si quieres cambiar la hora del digest
Edita `vercel.json`:
```json
{
  "schedule": "0 14 * * *"  // 14:00 UTC = 9:00 AM Colombia
}
```

Cambiar a 8:00 AM sería: `"0 13 * * *"`
Cambiar a 10:00 AM sería: `"0 15 * * *"`

### Si quieres agregar más destinatarios
Edita `src/app/api/cron/daily-digest/route.ts` línea ~360:
```typescript
to: ["juanjaramillo34@gmail.com", "otro@email.com"],
```

---

## 🎉 ¡Listo!

Una vez configuradas estas 4 cosas (5 minutos total), tendrás:

✅ **Digest diario** automático cada mañana
✅ **Alertas inmediatas** para problemas críticos
✅ **Resumen semanal** para revisar tendencias
✅ **Sin necesidad de entrar** a ninguna consola manualmente

**El sistema te avisará** cuando algo requiera tu atención.
