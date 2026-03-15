# 🤖 Guía para Entrenar Hugo - NODDO

Esta guía te explica paso a paso cómo entrenar a Hugo para que maneje **toda la ayuda de NODDO**.

---

## 📚 RECURSOS DISPONIBLES

Ya creamos estos archivos de entrenamiento:

```
scripts/hugo-training/
├── noddo-faq.md              # 100+ preguntas frecuentes
├── noddo-quick-start.md       # Guía de inicio rápido
└── HUGO-TRAINING-GUIDE.md     # Esta guía
```

---

## 🎯 PASO A PASO - ENTRENAR HUGO

### **PASO 1: Website Scraping** (Recomendado - lo más fácil)

#### A. Agregar página de ayuda principal
```
1. En Hugo → "1 Website" → Click para editar
2. Agregar URL: https://noddo.io/ayuda
3. Click "Crawl" o "Train"
4. Esperar 2-3 minutos mientras Hugo lee toda la página
```

**Qué aprende Hugo:**
- Todas las categorías de ayuda (Dashboard, Proyecto, Contenido, Ajustes, Flujos)
- Todos los artículos (proyectos, equipo, leads, torres, tipologías, galería, etc.)
- Pasos detallados de cada función
- Tips y mejores prácticas

#### B. Agregar páginas adicionales (opcional)
```
URLs adicionales para entrenar:
- https://noddo.io/ (homepage - entender qué es NODDO)
- https://noddo.io/legal/privacidad (políticas)
- https://noddo.io/legal/terminos (términos)
```

---

### **PASO 2: Upload Files**

#### A. Subir archivos de entrenamiento

```
1. En Hugo → "Files" → Click "Add"
2. Subir estos archivos uno por uno:

   📄 noddo-faq.md
   → 100+ preguntas frecuentes con respuestas

   📄 noddo-quick-start.md
   → Guía paso a paso para nuevos usuarios
```

#### B. Cómo subir
```
- Ir a: scripts/hugo-training/
- Arrastrar archivo a Hugo
- Esperar que procese (verde ✓)
- Repetir para cada archivo
```

---

### **PASO 3: Questions & Answers** (Opcional - refuerzo)

Si quieres reforzar preguntas específicas muy comunes:

```
1. En Hugo → "Questions & Answers" → Click "Add"
2. Agregar pares Q&A para casos específicos:
```

**Ejemplos de Q&A para agregar:**

```
Q: ¿Cuánto cuesta NODDO?
A: NODDO ofrece 3 planes: Proyecto (1 proyecto), Studio (hasta 10 proyectos) y Enterprise (ilimitado). Cada plan incluye todas las funciones principales. Para precios exactos, visita noddo.io/pricing o contacta a hola@noddo.io

Q: ¿Cómo publico mi proyecto?
A: Para publicar tu proyecto: 1) Ve a Editor → Configuración, 2) Tab "Publicación", 3) Verifica que el checklist esté completo (información básica, al menos 1 tipología, imágenes), 4) Click "Publicar Proyecto". Tu microsite estará en tu-proyecto.noddo.io

Q: No puedo subir imágenes, ¿qué hago?
A: Verifica: 1) El archivo es JPG o PNG (no GIF, no WEBP), 2) Pesa menos de 10MB, 3) Tienes buena conexión a internet. Si el problema persiste, intenta con otro navegador o contacta soporte por chat.

Q: ¿Cómo invito a mi equipo?
A: En Dashboard → Equipo → "Invitar colaborador". Ingresa el email de tu colega y selecciona su rol (Editor o Viewer). Recibirá una invitación por email. Disponible en planes Studio y Enterprise (hasta 3 colaboradores).

Q: ¿Los leads llegan a mi email?
A: Sí. Cada vez que alguien completa el formulario de contacto, recibes email inmediato con: nombre, email, teléfono, mensaje, unidad de interés, y fuente (de dónde vino: Facebook, Google, etc.). También puedes verlos en Dashboard → Leads.

Q: ¿Puedo cambiar los colores de mi microsite?
A: Sí. En Editor → Configuración → Branding. Puedes elegir color primario y secundario que aparecerán en todo tu microsite. También puedes subir tu logo.

Q: ¿Cómo agrego un video de YouTube?
A: Editor → Videos → "Agregar Video" → Pega el link completo de YouTube (ej: https://youtube.com/watch?v=ABC123). También soportamos Vimeo.

Q: ¿El autoguardado funciona siempre?
A: Sí. NODDO guarda automáticamente cada cambio que haces. Verás "✓ Guardado" en la esquina superior cuando se complete. No necesitas hacer click en "Guardar". Solo asegúrate de tener conexión a internet estable.

Q: ¿Puedo deshacer un cambio?
A: Sí. Usa Ctrl+Z (Windows) o Cmd+Z (Mac) para deshacer. También puedes ir a Configuración → Historial para revertir a versiones anteriores del proyecto.

Q: ¿Cómo marco una unidad como vendida?
A: Editor → Inventario → Click en la unidad → Cambiar estado a "Vendida". La unidad se mostrará en el microsite como vendida, generando urgencia en otros compradores.
```

---

## ⚙️ CONFIGURACIÓN DE HUGO

### Personalidad y Tono

Configura cómo Hugo debe responder:

```
Nombre: NODDO Assistant

Personalidad:
- Profesional pero amigable
- Experto en plataforma NODDO
- Paciente y claro en explicaciones
- Usa ejemplos concretos
- Proactivo en sugerir soluciones

Idioma: Español

Tono:
- Formal pero cercano (tutear)
- Directo y conciso
- Optimista y motivador
- Técnico cuando es necesario, simple cuando es posible
```

### Instrucciones Personalizadas

En la sección "Custom Instructions" de Hugo, agrega:

```
Eres el asistente virtual de NODDO, una plataforma SaaS para crear microsites inmobiliarios.

Tu objetivo es ayudar a usuarios de NODDO a:
1. Resolver dudas sobre cómo usar la plataforma
2. Guiarlos paso a paso en tareas específicas
3. Solucionar problemas técnicos comunes
4. Sugerir mejores prácticas

Cuando respondas:
- Sé específico con los pasos (1, 2, 3...)
- Usa rutas exactas (ej: "Dashboard → Proyectos → Nuevo Proyecto")
- Menciona dónde hacer click (ej: "Click en el botón 'Publicar'")
- Si no estás seguro, sugiere contactar soporte en vivo

Si el usuario tiene un problema que no puedes resolver:
1. Reconoce el problema
2. Sugiere soluciones básicas (recargar, otro navegador)
3. Si persiste, di: "Te conectaré con un asesor humano que puede ayudarte mejor"

Información de contacto:
- Chat en vivo: Disponible en noddo.io
- Email: hola@noddo.io
- Horario: Lunes a Viernes, 9am-6pm (hora Colombia)

Nunca inventes información que no tengas. Si no sabes algo, admítelo y ofrece conectar con soporte.
```

---

## 🧪 PROBAR HUGO

### Tests recomendados

Prueba Hugo con estas preguntas para verificar que aprendió bien:

```
✅ Preguntas básicas:
"¿Qué es NODDO?"
"¿Cuánto cuesta?"
"¿Cómo creo una cuenta?"

✅ Preguntas técnicas:
"¿Cómo publico mi proyecto?"
"¿Cómo subo imágenes?"
"¿Cómo marco una unidad como vendida?"

✅ Troubleshooting:
"No puedo subir imágenes"
"Los cambios no se guardan"
"El mapa no carga"

✅ Preguntas complejas:
"¿Cómo configuro mi propio dominio?"
"¿Cómo importo inventario desde Excel?"
"¿Cómo agrego puntos de interés al mapa?"
```

### Respuestas esperadas

Hugo debería:
- ✅ Responder en español
- ✅ Dar pasos específicos y numerados
- ✅ Mencionar rutas exactas en la plataforma
- ✅ Ofrecer soluciones alternativas
- ✅ Sugerir contactar soporte si no puede resolver

---

## 🎨 PERSONALIZAR WIDGET

### Colores

Configura el widget de Hugo para que haga match con NODDO:

```
Color primario: #b8973a (gold de NODDO)
Color secundario: #141414 (negro NODDO)
Color de fondo: #1a1a1a (superficie oscura)
Color de texto: #f4f0e8(texto cálido)
```

### Posición

```
Posición: Bottom right (esquina inferior derecha)
Distancia del borde: 24px
Tamaño del ícono: 60px
```

### Mensaje de bienvenida

```
Título: "¡Hola! 👋"
Mensaje: "Soy el asistente de NODDO. ¿En qué puedo ayudarte hoy?"

Sugerencias rápidas (chips):
- "¿Cómo publico mi proyecto?"
- "¿Cómo subo imágenes?"
- "¿Cómo invito a mi equipo?"
- "Hablar con un asesor"
```

---

## 🔄 ESCALACIÓN A HUMANO

### Cuándo Hugo debe escalar

Configura triggers para pasar a soporte humano:

```
Hugo debe decir "Te conectaré con un asesor" cuando:
- Usuario pide hablar con persona real
- Problema técnico complejo que no puede resolver
- Usuario frustrado (mensajes negativos repetidos)
- Pregunta sobre pricing/ventas específicas
- Solicitud de personalización enterprise
- Problema de pago/facturación
```

### Integración con Crisp

```
1. En Hugo → Settings → Integrations
2. Conectar con Crisp Chat
3. Configurar handoff:
   - Mensaje: "Te estoy conectando con [tu nombre]..."
   - Action: Abrir Crisp Chat
   - Transfer context: Sí (pasa historial de conversación)
```

---

## 📊 MÉTRICAS A MONITOREAR

Después de activar Hugo, revisa semanalmente:

```
✅ Tasa de resolución:
   → Meta: >70% de preguntas resueltas sin humano

✅ Satisfacción:
   → Meta: >4.5/5 estrellas

✅ Preguntas más frecuentes:
   → Mejora docs en estos temas

✅ Preguntas sin respuesta:
   → Agrega contenido faltante

✅ Tiempo promedio de respuesta:
   → Meta: <5 segundos
```

---

## 🔧 MANTENIMIENTO

### Actualizar Hugo regularmente

```
Cada mes:
1. Revisar preguntas sin respuesta buena
2. Agregar nuevo contenido a entrenamiento
3. Actualizar FAQs con casos nuevos
4. Re-crawlear noddo.io/ayuda (por si hubo cambios)
```

### Cuando agregues features nuevas

```
1. Documenta la feature en /ayuda
2. Hugo auto-aprenderá en próximo crawl
3. O agrega Q&A manual para feature
```

---

## ✅ CHECKLIST FINAL

Antes de activar Hugo en producción:

- [ ] Website scraping de noddo.io/ayuda completo
- [ ] Archivos FAQ y Quick Start subidos
- [ ] Custom instructions configuradas
- [ ] Personalidad y tono definidos
- [ ] Widget personalizado con colores NODDO
- [ ] Mensaje de bienvenida configurado
- [ ] Escalación a humano (Crisp) funcionando
- [ ] Probado con 20+ preguntas variadas
- [ ] Tasa de resolución >60% en tests
- [ ] Tiempos de respuesta <10 segundos
- [ ] Equipo capacitado en tomar handoffs de Hugo

---

## 🆘 SI HUGO NO RESPONDE BIEN

### Hugo da respuestas incorrectas:
```
1. Verificar que el contenido esté en los archivos entrenados
2. Agregar Q&A manual para esa pregunta específica
3. Re-entrenar con contenido actualizado
```

### Hugo no entiende preguntas en español:
```
1. Verificar config de idioma (debe ser "Spanish")
2. Agregar ejemplos de preguntas en español
3. Custom instructions en español
```

### Hugo escala mucho a humano:
```
1. Agregar más contenido de entrenamiento
2. Reforzar con Q&As manuales
3. Ajustar confidence threshold (menos conservador)
```

### Hugo es muy técnico o muy simple:
```
1. Ajustar instrucciones personalizadas
2. Dar ejemplos del tono deseado
3. Especificar nivel de detalle esperado
```

---

## 📞 SOPORTE HUGO

Si necesitas ayuda configurando Hugo:
- Docs de Hugo: [URL de docs de Hugo]
- Support de Hugo: [support email/chat]
- Community: [forum o Slack de Hugo si tiene]

---

¡Listo! Con esta guía Hugo quedará entrenado como un experto en NODDO 🚀
