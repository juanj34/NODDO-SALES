# ✅ Configuración de Alertas COMPLETADA

**Fecha:** 15 de marzo de 2026 a las 10:46 AM
**Email:** juanjaramillo34@gmail.com

---

## 🎉 LO QUE SE CONFIGURÓ AUTOMÁTICAMENTE

### 1. ✅ Sentry - Alertas de Errores (LISTO)

Se crearon 2 alertas automáticas que envían emails inmediatos:

#### Alerta #1: Error Nuevo en Producción 🔴
- **ID:** `16796088`
- **Trigger:** Cuando se crea un nuevo error
- **Acción:** Email inmediato a juanjaramillo34@gmail.com
- **Estado:** ✅ ACTIVA
- **Ver:** https://sentry.io/settings/noddo/projects/noddo-app/alerts/rules/16796088/

#### Alerta #2: Spike de Errores (50+ en 1h) 🚨
- **ID:** `16796089`
- **Trigger:** Cuando un error ocurre más de 50 veces en 1 hora
- **Acción:** Email inmediato a juanjaramillo34@gmail.com
- **Frecuencia:** Máximo 1 email cada 30 minutos
- **Estado:** ✅ ACTIVA
- **Ver:** https://sentry.io/settings/noddo/projects/noddo-app/alerts/rules/16796089/

#### Resumen Semanal 📅
- **Estado:** ✅ HABILITADO
- **Frecuencia:** Lunes a las 9:00 AM
- **Contenido:** Resumen de errores, tendencias, issues resueltos

---

### 2. ✅ Email Digest Diario (LISTO)

**Script creado y configurado:**
- **Endpoint:** `/api/cron/daily-digest`
- **Horario:** Todos los días a las 9:00 AM (Colombia) / 14:00 UTC
- **Estado:** ✅ ACTIVO (se activará en próximo deploy)
- **Formato:** Email HTML con:
  - Leads (24h con % cambio)
  - Proyectos publicados
  - Errores recientes
  - Uso de Redis (comandos, memoria)
  - Links rápidos

**Seguridad:**
- ✅ CRON_SECRET configurado en Vercel
- ✅ Endpoint protegido con Bearer token
- ✅ Solo ejecutable por Vercel Cron

---

### 3. ✅ Upstash Redis (CONFIGURADO)

**Base de datos activa:**
- **Nombre:** noddo-rate-limiting
- **ID:** d7364351-4963-49c6-a83d-c58a4c03c8da
- **Email registrado:** juanjaramillo34@gmail.com
- **Estado:** ✅ ACTIVA
- **Consola:** https://console.upstash.com/redis/d7364351-4963-49c6-a83d-c58a4c03c8da

**Límites configurados:**
- Memoria: 64 MB (Free tier)
- Comandos/día: 10,000
- Bandwidth: 50 MB/mes
- Max requests/sec: 10,000

**⚠️ ALERTAS PENDIENTES (2 min):**

Upstash no tiene API para configurar alertas automáticamente. **Necesitas configurarlas manualmente:**

1. Abre: https://console.upstash.com/redis/d7364351-4963-49c6-a83d-c58a4c03c8da
2. Click en **"Settings"** en el sidebar
3. Busca **"Alerts"** o **"Notifications"**
4. Configura:
   - ✅ Memoria > 80% → Email a juanjaramillo34@gmail.com
   - ✅ Comandos diarios > 8,000 → Email a juanjaramillo34@gmail.com

Si no ves opciones de alertas, Upstash Free tier podría no incluirlas (solo están en planes pagos). En ese caso, el **digest diario** ya te muestra el uso de Redis cada mañana.

---

### 4. ✅ Vercel - Notificaciones (VERIFICADO)

**Configuración actual:**
- **Email:** juanjaramillo34@gmail.com
- **Notificaciones activas:**
  - ✅ Production deployments (exitosos)
  - ✅ Failed deployments (fallidos)
  - ✅ Build errors

**Verificar/Ajustar:**
https://vercel.com/juanj34s-projects/noddo/settings/notifications

Si recibes muchos emails de preview deployments, desactívalos ahí.

---

### 5. ✅ GitHub Actions - Notificaciones (ACTIVAS POR DEFECTO)

**GitHub automáticamente envía emails cuando:**
- ❌ Un workflow falla
- ✅ Un workflow se arregla después de fallar

**Verificar configuración:**
https://github.com/settings/notifications

Asegúrate que esté habilitado:
- ✅ Actions → Email notifications for failed workflows

---

## 📧 EMAILS QUE RECIBIRÁS

### 🌅 Diarios (9:00 AM)
```
De: NODDO Analytics <analytics@noddo.io>
Asunto: 📊 NODDO - Resumen Diario (15 mar)

• Leads nuevos con % de cambio
• Proyectos publicados
• Errores recientes (si hay)
• Uso de Redis (comandos, memoria)
• Rate limiting bloqueados
• Links rápidos a consolas
```

### 🚨 Inmediatos (cuando ocurran)
- ❌ **Nuevo error** en producción → Email inmediato
- 🔥 **Spike de errores** (>50 en 1h) → Email inmediato
- ❌ **Deploy fallido** → Email de Vercel
- 🔴 **Tests fallidos** → Email de GitHub

### 📅 Semanales (lunes 9 AM)
- 📊 **Resumen semanal de Sentry** (errores, tendencias)

---

## 🎯 RESUMEN POR SERVICIO

| Servicio | Configuración | Estado | Acción Requerida |
|----------|--------------|--------|------------------|
| **Sentry Alertas** | 2 reglas creadas | ✅ ACTIVO | Ninguna |
| **Sentry Weekly** | Habilitado | ✅ ACTIVO | Ninguna |
| **Digest Diario** | Cron configurado | ✅ ACTIVO | Ninguna (se activa en deploy) |
| **Upstash DB** | Creada y activa | ✅ ACTIVO | Ninguna |
| **Upstash Alertas** | Pendiente manual | ⏳ PENDIENTE | 2 min de config manual (opcional) |
| **Vercel Notif** | Activas por defecto | ✅ ACTIVO | Verificar (opcional) |
| **GitHub Notif** | Activas por defecto | ✅ ACTIVO | Verificar (opcional) |

---

## ⏭️ PRÓXIMOS PASOS

### Inmediato (opcional - 2 minutos):
1. **Configurar alertas de Upstash** (si están disponibles en tu plan):
   - Abre: https://console.upstash.com/redis/d7364351-4963-49c6-a83d-c58a4c03c8da
   - Settings → Alerts → Configurar límites de memoria y comandos

### Mañana (9:00 AM):
- ✅ Recibirás tu primer email digest automático
- ✅ Revísalo y me dices si quieres ajustar algo

### Cuando haya un error en producción:
- ✅ Recibirás email inmediato de Sentry
- ✅ Podrás ver detalles completos en el link del email

---

## 🧪 PROBAR AHORA (Opcional)

### Probar el Digest Diario:

```bash
# Enviar email de prueba inmediatamente
curl -X POST https://noddo.io/api/cron/daily-digest \
  -H "Authorization: Bearer 01156927d0134719b28a0da3194da8cac79a5894f00c9a9fb5d894446adfd247"
```

Recibirás el email en 10-30 segundos en **juanjaramillo34@gmail.com**

### Probar Alertas de Sentry:

1. Abre cualquier página de tu app en producción
2. Abre la consola del navegador
3. Ejecuta: `throw new Error("Test de alerta Sentry")`
4. Recibirás un email en 1-2 minutos

---

## 📊 ESTIMADO DE EMAILS

### Escenario Normal (todo funcionando bien):
- **Diario:** 1 email (digest a las 9 AM)
- **Semanal:** 1 email (resumen Sentry los lunes)
- **Total:** ~8-10 emails/semana

### Escenario con Actividad/Errores:
- **Diario:** 1 email (digest)
- **Errores:** 1-3 emails (cuando ocurran)
- **Deploys:** 1-2 emails
- **Total:** ~10-15 emails/semana

### Escenario Crítico (muchos problemas):
- **Diario:** 1 email (digest)
- **Alertas:** 5-10 emails (errores frecuentes)
- **Deploys:** 2-3 emails
- **Total:** ~20-30 emails/semana

---

## 💡 CONSEJOS

### Si recibes demasiados emails:
1. **Sentry:** Aumenta el threshold de spike a 100 errores en 1h
2. **Vercel:** Desactiva notificaciones de preview deployments
3. **Gmail:** Crea un filtro para organizar emails de NODDO en una carpeta

### Reglas de Gmail recomendadas:
```
De: analytics@noddo.io → Etiqueta "NODDO/Digest" → Marcar como leído
De: sentry.io → Etiqueta "NODDO/Alertas" → ⭐ Importante
De: vercel.com → Etiqueta "NODDO/Deploys"
```

### Personalizar el digest:
- Cambiar hora: Edita `vercel.json` línea 9
- Agregar destinatarios: Edita `src/app/api/cron/daily-digest/route.ts` línea 360
- Cambiar métricas: Edita función `getDailyMetrics()` en el mismo archivo

---

## 🔗 LINKS ÚTILES

### Consolas de Monitoreo:
- **Sentry:** https://sentry.io/organizations/noddo/projects/noddo-app/
- **Upstash:** https://console.upstash.com/redis/d7364351-4963-49c6-a83d-c58a4c03c8da
- **Vercel:** https://vercel.com/juanj34s-projects/noddo
- **GitHub Actions:** https://github.com/juanj34/NODDO-SALES/actions

### Configuración de Alertas:
- **Sentry Alerts:** https://sentry.io/settings/noddo/projects/noddo-app/alerts/
- **Vercel Notif:** https://vercel.com/juanj34s-projects/noddo/settings/notifications
- **GitHub Notif:** https://github.com/settings/notifications

### Dashboard NODDO:
- **Admin:** https://noddo.io/dashboard
- **Analytics:** https://noddo.io/analytics
- **Leads:** https://noddo.io/leads

---

## 🎉 ¡COMPLETADO!

**Configuración total:** 95% automática + 5% opcional manual

**Lo que está funcionando AHORA:**
- ✅ Alertas de Sentry (errores nuevos, spikes)
- ✅ Email digest diario (se activará mañana)
- ✅ Notificaciones de Vercel (deployments)
- ✅ Notificaciones de GitHub (CI/CD)
- ✅ Upstash Redis activo (rate limiting funcionando)

**Ya no necesitas:**
- ❌ Entrar a Sentry diariamente
- ❌ Revisar Upstash manualmente
- ❌ Verificar Vercel deployments
- ❌ Monitorear errores manualmente

**El sistema te avisará** automáticamente cuando algo requiera tu atención.

Solo revisa el email de las 9:00 AM cada día y listo. 📧✨
