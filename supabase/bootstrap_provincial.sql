-- ============================================================================
-- Bootstrap del primer Coordinador Provincial (ejecutar UNA vez en SQL Editor)
-- 1. Primero crea el usuario en Supabase -> Authentication -> Users -> Add user
--    con tu correo y contraseña inicial: Ecuador2026 (marca Auto Confirm User).
-- 2. Copia el UUID del usuario creado y reemplaza los valores abajo.
-- ============================================================================

INSERT INTO public.perfiles (
  id,
  cedula,
  nombres,
  apellidos,
  telefono,
  email,
  rol,
  recinto_id,
  creado_por,
  debe_cambiar_clave
)
VALUES (
  'REEMPLAZA-CON-UUID-DE-AUTH-USERS',
  '1710034065',
  'Eduardo',
  'Ganchala',
  '0999999999',
  'tu-correo@ejemplo.com',
  'provincial',
  NULL,
  NULL,
  TRUE
)
ON CONFLICT (id) DO NOTHING;
