# ✅ Crisp Chat + Hugo AI - Setup Simple (Solo Soporte)

## 🎯 ¿Qué se Implementó?

Crisp Chat widget integrado **solo en el dashboard/editor** para que usuarios puedan pedir ayuda mientras crean sus proyectos.

**NO** en microsites públicos — solo para usuarios autenticados.

---

## ✅ Lo Que Ya Está Listo

### 1. **Crisp Widget Integrado**

- **Ubicación**: Solo aparece en `/dashboard`, `/proyectos`, `/editor/*`, `/leads`, `/analytics`
- **NO aparece**: En los microsites públicos (`/sites/[slug]`)
- **Componente**: `src/components/dashboard/CrispSupport.tsx`
- **Website ID**: `04df82c6-3371-4076-81e4-22e99493086e` ✅

### 2. **Archivos Modificados**

```
✅ src/components/dashboard/CrispSupport.tsx  (nuevo)
✅ src/app/(dashboard)/layout.tsx              (agregado widget)
✅ .env.local                                  (agregado CRISP_WEBSITE_ID)
✅ .env.example                                (actualizado con tu ID)
```

### 3. **Avatar y Materiales de Hugo**

```
✅ public/hugo-avatar.svg                      (avatar para Hugo)
✅ scripts/hugo-training/noddo-faq.md          (100+ FAQs)
✅ scripts/hugo-training/noddo-quick-start.md  (guía de inicio)
✅ scripts/hugo-training/HUGO-TRAINING-GUIDE.md (instrucciones)
```

---

## 🚀 Siguiente Paso: Entrenar Hugo (5 minutos)

Ahora solo falta entrenar a Hugo para que responda preguntas automáticamente.

### **Opción Recomendada: Website Scraping** (Más fácil)

1. **Login a Crisp**: https://app.crisp.chat/
2. **Ir a Hugo AI**:
   - Sidebar → "AI Agent" (ícono de robot 🤖)
3. **Agregar fuentes de entrenamiento**:

   **A. Crawlear tu sitio de ayuda** (5 min):
   - Click "1 Website"
   - Add URL: `https://noddo.io/ayuda`
   - Click "Crawl"
   - Esperar 2-3 minutos mientras Hugo lee toda tu documentación

   **B. Subir archivos de FAQs** (opcional, 2 min):
   - Click "Files"
   - Subir `scripts/hugo-training/noddo-faq.md`
   - Subir `scripts/hugo-training/noddo-quick-start.md`

4. **Configurar avatar** (1 min):
   - Hugo → Settings → Avatar
   - Subir `public/hugo-avatar.svg`

5. **Custom Instructions** (2 min):
   - Hugo → Settings → Custom Instructions
   - Pegar esto:

   ```
   Eres el asistente de soporte de NODDO, una plataforma SaaS para crear microsites inmobiliarios.

   Tu objetivo es ayudar a usuarios a resolver dudas sobre cómo usar la plataforma.

   Cuando respondas:
   - Sé específico con los pasos (1, 2, 3...)
   - Usa rutas exactas (ej: "Dashboard → Proyectos → Nuevo Proyecto")
   - Si no puedes resolver, di: "Te voy a conectar con un asesor humano"

   Contacto de soporte:
   - Email: hola@noddo.io
   - Horario: Lunes-Viernes 9am-6pm (hora Colombia)

   Nunca inventes información. Si no sabes algo, admítelo y ofrece conectar con soporte.
   ```

6. **Widget Styling** (1 min):
   - Hugo → Settings → Widget
   - Color primario: `#b8973a` (gold de NODDO)
   - Mensaje de bienvenida: "¡Hola! 👋 Soy el asistente de NODDO. ¿En qué puedo ayudarte?"

---

## 🧪 Probar que Funciona

1. **Verificar widget en dashboard**:
   - Abrir http://localhost:3000/dashboard (o tu sitio en producción)
   - Login con tu cuenta
   - Deberías ver el widget de Crisp en la esquina inferior derecha

2. **Hacer pregunta a Hugo**:
   - Click en el widget
   - Escribe: "¿Cómo publico mi proyecto?"
   - Hugo debería responder con pasos específicos

3. **Verificar que NO aparece en microsites**:
   - Abrir un microsite público: http://localhost:3000/sites/tu-proyecto
   - El widget de Crisp NO debería aparecer ✅

---

## 📊 Lo Que Hugo Puede Hacer (Solo Soporte)

### ✅ Hugo PUEDE:
- Responder preguntas sobre cómo usar NODDO
- Guiar paso a paso en tareas (publicar proyecto, subir imágenes, etc.)
- Buscar en documentación automáticamente
- Escalar a humano si no puede resolver

### ❌ Hugo NO PUEDE:
- Modificar proyectos
- Cambiar disponibilidad de unidades
- Editar precios
- Acceder a datos privados de otros usuarios
- Crear/eliminar proyectos

**Es solo un asistente de soporte** 👍

---

## 🔐 Seguridad

- ✅ Widget solo carga en dashboard (usuarios autenticados)
- ✅ NO aparece en microsites públicos
- ✅ Hugo NO tiene acceso a modificar nada en la base de datos
- ✅ Solo responde basado en documentación que tú le das

---

## 💡 ¿Quieres que Hugo Acceda a Datos Reales?

Si más adelante quieres que Hugo pueda:
- Consultar disponibilidad de unidades en tiempo real
- Ver información de proyectos específicos
- Responder "¿Cuántas unidades quedan en Torre A?"

Entonces sí necesitarías el **MCP server** (que ya creamos en `mcp-server/`).

Pero ese MCP server sería **solo para LECTURA**, nunca para modificar datos.

**Por ahora NO lo necesitas** — Hugo funciona perfecto solo con la documentación 👍

---

## 🆘 Troubleshooting

### Widget no aparece en dashboard

**Causa**: Variable de entorno no cargada.

**Fix**:
1. Verifica que `.env.local` tenga:
   ```
   NEXT_PUBLIC_CRISP_WEBSITE_ID=04df82c6-3371-4076-81e4-22e99493086e
   ```
2. Restart dev server: `npm run dev`
3. Reload página con Ctrl+Shift+R (hard refresh)

---

### Hugo no responde bien

**Causa**: No está entrenado todavía.

**Fix**:
1. Ir a Crisp → AI Agent → Website
2. Agregar URL: `https://noddo.io/ayuda`
3. Click "Crawl"
4. Esperar 2-3 minutos
5. Probar de nuevo

---

### Hugo responde en inglés

**Causa**: Idioma no configurado.

**Fix**:
1. Crisp → AI Agent → Settings
2. Language: Spanish
3. Custom Instructions: (en español, ver arriba)
4. Save

---

## ✅ Checklist Final

- [x] Crisp widget integrado en dashboard
- [x] Website ID configurado en `.env.local`
- [x] Componente creado y commiteado
- [ ] Hugo entrenado (crawl de https://noddo.io/ayuda)
- [ ] Avatar subido a Hugo
- [ ] Custom instructions configuradas
- [ ] Widget styling (colores gold)
- [ ] Probado con 5+ preguntas

---

## 📈 Métricas a Monitorear (Después de 1 Semana)

En Crisp → Conversations → Reports:

- **Tasa de resolución**: % de chats resueltos por Hugo sin humano (meta: >60%)
- **Tiempo de respuesta**: Cuánto tarda Hugo en responder (meta: <5 seg)
- **Satisfacción**: CSAT score (meta: >4.5/5 estrellas)
- **Preguntas frecuentes**: Qué preguntan más (para mejorar docs)

---

## 🎓 Recursos

- [Crisp Dashboard](https://app.crisp.chat/)
- [Hugo AI Knowledge Base](https://help.crisp.chat/en/category/hugo-ai-agent-chatbot-1yxt4vb/)
- [Documentación NODDO](https://noddo.io/ayuda)

---

**Implementado**: 15 de Marzo, 2026
**Tiempo total**: ~3 minutos
**Costo**: $0/mes (plan gratuito de Crisp)
**Siguiente paso**: Entrenar Hugo (5 min)

---

## 🎉 ¡Ya Está Listo el Widget!

Solo falta entrenar a Hugo en Crisp y ya tienes soporte automático en tu dashboard 🚀
