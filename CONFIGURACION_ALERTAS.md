# 📧 Configuración de Alertas por Email

**Fecha:** 15 de marzo de 2026
**Objetivo:** Recibir todas las alertas importantes en tu email sin tener que entrar a cada consola

---

## 🎯 Resumen de Alertas

Una vez configurado, recibirás emails automáticos para:

- ❌ **Errores críticos** en producción (Sentry)
- ⚠️ **Uso alto** de Redis (Upstash)
- 🚨 **Rate limiting** excesivo (Upstash)
- ✅ **Deployments** exitosos/fallidos (Vercel)
- 🔴 **Tests fallidos** en CI/CD (GitHub Actions)
- 📊 **Resumen semanal** de analytics

---

## 1. Sentry - Alertas de Errores

### Configuración (2 minutos)

#### Paso 1: Ir a configuración de alertas
1. Abre: https://sentry.io/settings/noddo/projects/noddo-app/alerts/
2. Click en **"Create Alert"**

#### Paso 2: Crear alerta para errores críticos

**Alert #1: Errores Nuevos**
```
Nombre: "🔴 Error Nuevo en Producción"
Condiciones:
  - When: A new issue is created
  - And: Environment equals production
Acciones:
  - Send a notification via email to: juanjaramillo34@gmail.com
  - Frequency: Immediately
```

**Alert #2: Errores Frecuentes**
```
Nombre: "⚠️ Error Frecuente (>10 en 1h)"
Condiciones:
  - When: An issue is seen more than 10 times in 1 hour
  - And: Environment equals production
Acciones:
  - Send a notification via email to: juanjaramillo34@gmail.com
  - Frequency: At most once every 30 minutes
```

**Alert #3: Spike de Errores**
```
Nombre: "🚨 Spike de Errores (>100 en 1h)"
Condiciones:
  - When: The event count for a project is more than 100 in 1 hour
  - And: Environment equals production
Acciones:
  - Send a notification via email to: juanjaramillo34@gmail.com
  - Frequency: Immediately
```

#### Paso 3: Configurar Resumen Semanal

1. Ve a: https://sentry.io/settings/account/notifications/
2. Habilita:
   - ✅ **Weekly Reports** → Enviar a: juanjaramillo34@gmail.com
   - ✅ **Deploy Notifications** → Enviar a: juanjaramillo34@gmail.com
3. Desabilita (para no recibir spam):
   - ❌ **Workflow Notifications** (solo para equipos grandes)

---

## 2. Upstash - Alertas de Redis

### Configuración (1 minuto)

#### Paso 1: Ir a configuración de alertas
1. Abre: https://console.upstash.com/redis/d7364351-4963-49c6-a83d-c58a4c03c8da
2. Click en **"Settings"** (sidebar izquierdo)
3. Scroll hasta **"Alerts"**

#### Paso 2: Crear alertas

**Alert #1: Uso de Memoria Alto**
```
Trigger: Memory Usage > 80%
Email: juanjaramillo34@gmail.com
Mensaje: "⚠️ NODDO Redis usando más del 80% de memoria"
```

**Alert #2: Comandos Diarios Cercanos al Límite**
```
Trigger: Daily Commands > 8000 (80% del límite de 10K)
Email: juanjaramillo34@gmail.com
Mensaje: "⚠️ NODDO Redis usando más del 80% de comandos diarios"
```

**Alert #3: Rate Limiting Activo Frecuentemente**
```
Trigger: High Request Rate (>1000 requests/min)
Email: juanjaramillo34@gmail.com
Mensaje: "🚨 NODDO Rate limiting bloqueando muchos requests"
```

> **Nota:** Si no encuentras estas opciones exactas en Upstash, usa su sistema de "Notifications" o "Monitoring Alerts" que tenga disponible.

---

## 3. Vercel - Alertas de Deployments

### Configuración Automática (Ya está activo)

Vercel ya envía emails automáticamente a **juanjaramillo34@gmail.com** para:

- ✅ Deployment exitoso en producción
- ❌ Deployment fallido
- ⚠️ Build warnings
- 🔄 Preview deployments (opcional)

#### Personalizar Notificaciones

1. Ve a: https://vercel.com/juanj34s-projects/noddo/settings/notifications
2. Configura:
   - ✅ **Production Deployments** → Always notify
   - ✅ **Failed Deployments** → Always notify
   - ⚠️ **Preview Deployments** → Only on failure (para no recibir spam)

---

## 4. GitHub Actions - Alertas de CI/CD

### Configuración (30 segundos)

#### Opción A: Notificaciones de GitHub (Automático)

GitHub ya envía emails por defecto cuando:
- ❌ Un workflow falla
- ✅ Un workflow se arregla después de fallar

Para verificar:
1. Ve a: https://github.com/settings/notifications
2. Asegúrate que esté habilitado:
   - ✅ **Actions** → Email notifications for failed workflows
   - ✅ Email: juanjaramillo34@gmail.com

#### Opción B: Notificaciones Personalizadas (Opcional)

Si quieres más control, puedo agregar un paso en el workflow que envíe emails personalizados usando GitHub Actions + Resend.

---

## 5. Resend - Alertas de Emails Transaccionales

### Configuración de Monitoreo

1. Ve a: https://resend.com/webhooks
2. Crea un webhook para:
   - ❌ **Email bounced** (rebotado)
   - ❌ **Email failed** (fallido)
   - ⚠️ **Spam complaint** (marcado como spam)

Esto te alertará si hay problemas enviando emails desde tu app (leads, notificaciones, etc.)

---

## 6. Dashboard Unificado (Opcional - 10 min de setup)

### Opción 1: Email Digest Diario

Puedo crear un script que te envíe un email diario con:

```
📊 NODDO - Resumen Diario (15 marzo 2026)

🎯 Métricas Clave:
  • Leads: 12 nuevos (↑ 20% vs ayer)
  • Visitas: 245 (↑ 5% vs ayer)
  • Errores: 3 (↓ 50% vs ayer)

⚡ Upstash Redis:
  • Comandos hoy: 3,245 / 10,000 (32%)
  • Memoria: 4.2 MB / 25 MB (17%)
  • Rate limiting: 15 requests bloqueados

🔴 Errores Recientes:
  1. TypeError en /api/leads - 2 ocurrencias
  2. 404 en /sites/demo/contacto - 1 ocurrencia

✅ Deployments:
  • Último: main@f8c48e9 - Exitoso hace 2h

🔗 Links Rápidos:
  • Sentry: https://sentry.io/...
  • Upstash: https://console.upstash.com/...
  • Vercel: https://vercel.com/...
```

### Opción 2: Slack/Discord Webhook

Si prefieres Slack o Discord en lugar de email, puedo configurar webhooks que envíen notificaciones ahí.

---

## 🎯 Configuración Recomendada (30 minutos total)

### Prioridad Alta (Hacer ahora)
1. ✅ **Sentry** - Alertas de errores críticos (5 min)
2. ✅ **Upstash** - Alertas de uso alto (2 min)
3. ✅ **Vercel** - Verificar que emails estén activos (1 min)

### Prioridad Media (Hacer esta semana)
4. ✅ **GitHub Actions** - Verificar notificaciones (1 min)
5. ✅ **Resend** - Webhooks para emails fallidos (5 min)

### Opcional (Hacer si quieres)
6. ⭐ **Email Digest Diario** - Script automático (10 min)
7. ⭐ **Slack/Discord** - Webhooks unificados (10 min)

---

## 📧 Emails que Recibirás

Una vez configurado, tu inbox tendrá:

### Diarios (si hay actividad)
- 📊 Resumen diario de métricas (1 email/día a las 9 AM)
- ❌ Errores nuevos en producción (solo si hay)
- ⚠️ Alertas de uso alto de Upstash (solo si excede límites)

### Semanales
- 📈 Resumen semanal de Sentry (1 email/semana los lunes)
- 📊 Estadísticas de Vercel (1 email/semana)

### Críticos (inmediatos)
- 🚨 Errores críticos en producción
- ❌ Deployment fallido
- 🔴 Tests fallidos en CI/CD
- ⚠️ Upstash cerca del límite

### Total estimado
- **Normal:** 1-3 emails/día
- **Con errores:** 5-10 emails/día
- **Sin actividad:** 2 emails/semana (resúmenes)

---

## 🚀 Bonus: Script de Email Digest Diario

Si quieres, puedo crear un script que:
1. Se ejecute automáticamente cada día a las 9 AM
2. Recopile métricas de Supabase, Upstash, Sentry, Vercel
3. Te envíe un email bonito con el resumen

Esto lo puedo hacer con:
- **Opción A:** GitHub Actions (gratis, corre en GitHub)
- **Opción B:** Vercel Cron (gratis, corre en Vercel)
- **Opción C:** Upstash QStash (gratis, más confiable)

---

## 🎯 Siguiente Paso

¿Qué quieres configurar primero?

**A) Configuración Básica (te guío paso a paso ahora mismo)**
   - Sentry alertas de errores
   - Upstash alertas de uso
   - Verificar Vercel

**B) Script de Email Digest Diario (lo creo yo ahora)**
   - Un email cada mañana con todo resumido
   - Usa Vercel Cron + Resend
   - 10 minutos de setup

**C) Ambas (lo ideal)**
   - Alertas críticas inmediatas
   - + Resumen diario tranquilo

---

## 💡 Consejo

Personalmente recomiendo **Opción C**:
- Las alertas inmediatas te salvan de errores críticos
- El digest diario te mantiene informado sin spam
- Solo revisas las consolas si algo se ve raro en el digest

¿Qué prefieres?
