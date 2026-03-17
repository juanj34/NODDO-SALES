# 🚀 Workflow de Desarrollo NODDO

## 📋 Protocolo de Commits

### ✅ Desarrollo Diario (GRATIS - Rama `dev`)

**Cuándo:** Para cualquier cambio, feature, fix, o experimento

**Pasos:**

```bash
# 1. Verificar que estás en dev
git branch
# Debe mostrar: * dev

# 2. Hacer tus cambios en el código...

# 3. Commit
git add .
git commit -m "tipo: descripción breve"

# 4. Push (crea preview gratis en Vercel)
git push origin dev
```

**Tipos de commit:**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `style:` Cambios de estilo/diseño
- `refactor:` Refactorización de código
- `chore:` Tareas menores (actualizaciones, limpieza)
- `docs:` Cambios en documentación

**Ejemplo:**
```bash
git commit -m "feat: add dark mode toggle to settings"
git commit -m "fix: form validation error on signup"
git commit -m "style: update button colors to brand gold"
```

---

### 🎯 Publicación a Producción (CUESTA $$$ - Rama `main`)

**Cuándo publicar a `main`:**
- ✅ Feature está 100% funcional y testeado en preview
- ✅ No tiene bugs conocidos
- ✅ Se ve bien en desktop Y mobile
- ✅ Formularios/flows funcionan correctamente
- ✅ **ME AVISAS PRIMERO** antes de publicar

**NUNCA publicar a `main` si:**
- ❌ Código tiene console.logs de debug
- ❌ Hay TODOs o comentarios de desarrollo
- ❌ Feature está a medio hacer
- ❌ No has probado en preview primero
- ❌ Hay errores en el build

**Pasos para publicar (SOLO cuando esté listo):**

```bash
# 1. Ir a main
git checkout main

# 2. Traer cambios de dev
git merge dev

# 3. Verificar que TODO está bien
npm run build

# 4. PREGUNTAR A JUAN ANTES DE CONTINUAR
# ⚠️ Pausa aquí y confirma que quieres publicar

# 5. Push a producción (esto SÍ cuesta)
git push origin main
```

---

## 🌐 Dominios y URLs

### Preview (Desarrollo - GRATIS)
- **Rama:** `dev`
- **URL:** `noddo-sales-git-dev-juanj34s-projects.vercel.app`
- **Uso:** Testing, desarrollo, mostrar a stakeholders
- **Micrositios:** `preview-url.vercel.app/sites/proyecto-slug`

### Producción (Cuesta $$$)
- **Rama:** `main`
- **URL:** `noddo.io` (dominio principal)
- **Uso:** Solo cuando todo está perfecto y listo para clientes
- **Micrositios:** `noddo.io/sites/proyecto-slug`

**Por ahora:** Usamos SOLO preview URLs (gratis) hasta que tengamos todo pulido.

---

## 🤖 Protocolo con Claude Code

### Antes de Empezar una Tarea

1. **Describir qué necesitas:**
   ```
   "Necesito agregar un botón de logout al dashboard"
   "Hay un bug en el formulario de contacto que no envía emails"
   ```

2. **Claude planea la implementación**
   - Te muestra qué archivos va a modificar
   - Te pregunta si es correcto el approach
   - **TÚ APRUEBAS antes de que empiece**

3. **Claude implementa**
   - Hace los cambios
   - Corre tests si hay
   - Verifica que compila

4. **Revisas en preview**
   - Claude hace commit a `dev`
   - Push crea preview en Vercel
   - Tú pruebas la URL de preview

5. **Si está bien → Merge a main (más tarde)**
   - Si funciona perfecto en preview
   - **ME DICES** que quieres publicar
   - Claude hace merge a main

### Cuándo Preguntar a Claude

**SÍ preguntar:**
- ✅ "¿Cómo implemento X feature?"
- ✅ "¿Por qué no funciona Y?"
- ✅ "¿Cuál es la mejor forma de hacer Z?"
- ✅ "Revisa este error que estoy viendo"

**NO hacer:**
- ❌ Push directo a main sin avisar
- ❌ Mergear a main sin probar en preview primero
- ❌ Commitear código que no compila

---

## 🔒 Reglas de Seguridad

### NUNCA hagas push a `main` sin:
1. Probar en preview primero
2. Verificar build: `npm run build`
3. Confirmar que funciona en mobile
4. Avisar que vas a publicar

### Señales de Alerta 🚨

Si ves esto, **DETENTE**:
```bash
git branch
# * main  ← ¡PELIGRO! Estás en main
```

**Acción:** Volver a dev inmediatamente:
```bash
git checkout dev
```

---

## 📊 Cheat Sheet Rápido

| Acción | Comando | Costo |
|--------|---------|-------|
| Ver rama actual | `git branch` | Gratis |
| Cambiar a dev | `git checkout dev` | Gratis |
| Commit en dev | `git add . && git commit -m "msg" && git push origin dev` | Gratis |
| Ver preview URL | Ir a Vercel dashboard | Gratis |
| Publicar a producción | `git checkout main && git merge dev && git push origin main` | $$$ |

---

## 💡 Tips

- **Commits frecuentes:** Mejor hacer commits pequeños y frecuentes que uno grande
- **Mensajes claros:** Usa mensajes descriptivos (no "fix", usa "fix: email validation error")
- **Preview primero:** SIEMPRE prueba en preview antes de publicar a main
- **Backup automático:** Cada commit es un backup, commit frecuentemente

---

## 🆘 ¿Hiciste push a main por error?

**No te preocupes, se puede revertir:**

```bash
# 1. Ver último commit de main
git log --oneline -5

# 2. Revertir al commit anterior
git reset --hard HEAD~1

# 3. Force push (solo esta vez)
git push origin main --force

# 4. Volver a dev
git checkout dev
```

**Luego me avisas y revisamos juntos.**

---

## 📞 Cuándo Avisar a Juan

- ✅ Antes de publicar a `main`
- ✅ Si algo no funciona en preview
- ✅ Antes de hacer cambios grandes (rediseños, refactors)
- ✅ Si ves errores extraños
- ✅ Antes de borrar código que no entiendes

---

**Última actualización:** 2026-03-17
