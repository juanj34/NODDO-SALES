-- =====================================================
-- Script para crear el PRIMER Platform Admin
-- =====================================================
--
-- USO:
-- 1. Primero crea un usuario en Supabase Auth (puede ser desde /login)
-- 2. Copia el email del usuario que quieres hacer admin
-- 3. Ejecuta este script en Supabase SQL Editor
-- 4. Reemplaza 'tu-email@ejemplo.com' con tu email real
--
-- Después de ejecutar este script, podrás acceder a /admin
-- =====================================================

-- PASO 1: Buscar el user_id por email
-- Ejecuta este query primero para obtener el user_id
SELECT
  id as user_id,
  email,
  created_at,
  confirmed_at
FROM auth.users
WHERE email = 'tu-email@ejemplo.com';  -- REEMPLAZA CON TU EMAIL

-- PASO 2: Insertar en platform_admins
-- Usa el user_id que obtuviste del query anterior
INSERT INTO platform_admins (user_id, email, nombre)
VALUES (
  'PEGA-AQUI-EL-USER-ID-DEL-PASO-1',  -- user_id del paso 1
  'tu-email@ejemplo.com',              -- Tu email
  'Tu Nombre'                          -- Tu nombre (opcional)
)
ON CONFLICT (user_id) DO NOTHING;

-- PASO 3: Verificar que se creó correctamente
SELECT * FROM platform_admins WHERE email = 'tu-email@ejemplo.com';

-- =====================================================
-- SCRIPT ALTERNATIVO: TODO EN UNO (más fácil)
-- =====================================================
-- Simplemente reemplaza el email y ejecuta esto:

WITH user_lookup AS (
  SELECT id, email
  FROM auth.users
  WHERE email = 'tu-email@ejemplo.com'  -- REEMPLAZA CON TU EMAIL
  LIMIT 1
)
INSERT INTO platform_admins (user_id, email, nombre)
SELECT
  id,
  email,
  'Admin Principal'  -- REEMPLAZA CON TU NOMBRE
FROM user_lookup
ON CONFLICT (user_id) DO NOTHING
RETURNING *;

-- ¡Listo! Ahora puedes acceder a http://localhost:3000/admin
