-- ============================================================================
-- Nivel 2 · Pruebas SQL de Seguridad (RLS), Aislamiento de Veedor (R8),
-- Cambio Obligatorio de Clave (R3), Consistencia de Totales (R6) y Conflictos (R10).
-- Ejecutar en Supabase -> SQL Editor. Todo corre dentro de BEGIN / ROLLBACK
-- para no dejar datos basura en producción.
-- Trazabilidad: ADR-002, ADR-008, ADR-010
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_recinto_1 UUID;
  v_recinto_2 UUID;
  v_jrv_1 UUID;
  v_jrv_2 UUID;
  v_cand_1 UUID;
  v_veedor_a UUID := '11111111-1111-1111-1111-111111111111';
  v_veedor_b UUID := '22222222-2222-2222-2222-222222222222';
  v_coord_1  UUID := '33333333-3333-3333-3333-333333333333';
  v_sin_clave UUID := '44444444-4444-4444-4444-444444444444';
  v_count INTEGER;
  v_fallo BOOLEAN;
BEGIN
  -- 1. Seleccionar dos recintos y una candidatura del seed R1
  SELECT id INTO v_recinto_1 FROM public.recintos ORDER BY nombre ASC LIMIT 1;
  SELECT id INTO v_recinto_2 FROM public.recintos ORDER BY nombre ASC OFFSET 1 LIMIT 1;
  SELECT id INTO v_jrv_1 FROM public.jrv WHERE recinto_id = v_recinto_1 ORDER BY numero LIMIT 1;
  SELECT id INTO v_jrv_2 FROM public.jrv WHERE recinto_id = v_recinto_2 ORDER BY numero LIMIT 1;
  SELECT id INTO v_cand_1 FROM public.candidaturas WHERE dignidad = 'alcalde' LIMIT 1;

  -- 2. Crear usuarios sintéticos en auth.users y perfiles
  INSERT INTO auth.users (id, email) VALUES
    (v_veedor_a, 'test-veedor-a@example.com'),
    (v_veedor_b, 'test-veedor-b@example.com'),
    (v_coord_1,  'test-coord-1@example.com'),
    (v_sin_clave,'test-sin-clave@example.com')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.perfiles (id, cedula, nombres, apellidos, telefono, email, rol, recinto_id, debe_cambiar_clave)
  VALUES
    (v_veedor_a, '9900000001', 'Veedor', 'A', '0991111111', 'test-veedor-a@example.com', 'veedor', v_recinto_1, FALSE),
    (v_veedor_b, '9900000002', 'Veedor', 'B', '0992222222', 'test-veedor-b@example.com', 'veedor', v_recinto_2, FALSE),
    (v_coord_1,  '9900000003', 'Coord',  'Uno', '0993333333', 'test-coord-1@example.com', 'recinto', v_recinto_1, FALSE),
    (v_sin_clave,'9900000004', 'Sin', 'Clave', '0994444444', 'test-sin-clave@example.com', 'veedor', v_recinto_1, TRUE)
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.jrv SET veedor_id = v_veedor_a WHERE id = v_jrv_1;
  UPDATE public.jrv SET veedor_id = v_veedor_b WHERE id = v_jrv_2;

  -- Simular contexto autenticado (rol authenticated de PostgREST)
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- TEST 1 (R8): Veedor A SOLO ve su mesa (v_jrv_1) y devuelve 0 filas para v_jrv_2
  PERFORM set_config('request.jwt.claim.sub', v_veedor_a::TEXT, TRUE);
  SELECT COUNT(*) INTO v_count FROM public.jrv WHERE id = v_jrv_2;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FALLO TEST 1: Veedor A pudo leer una JRV ajena!';
  END IF;

  -- TEST 2 (R8): Veedor A NO puede insertar un acta en la mesa de Veedor B
  v_fallo := FALSE;
  BEGIN
    INSERT INTO public.actas (
      jrv_id, dignidad, nulos, blancos, total_sufragantes, foto_path, estado, actualizado_por
    ) VALUES (
      v_jrv_2, 'alcalde', 0, 0, 0, 'fake/path.jpg', 'VALIDADA', v_veedor_a
    );
  EXCEPTION WHEN insufficient_privilege THEN
    v_fallo := TRUE;
  END;
  IF NOT v_fallo THEN
    RAISE EXCEPTION 'FALLO TEST 2: Veedor A pudo insertar un acta en mesa ajena!';
  END IF;

  -- TEST 3 (R3): Usuario con debe_cambiar_clave = TRUE recibe 0 filas en recintos/jrv
  PERFORM set_config('request.jwt.claim.sub', v_sin_clave::TEXT, TRUE);
  SELECT COUNT(*) INTO v_count FROM public.recintos;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FALLO TEST 3: Usuario sin cambiar contraseña inicial pudo leer recintos!';
  END IF;

  -- TEST 4 (R8): Coordinador de recinto 1 NO puede ver JRV del recinto 2
  PERFORM set_config('request.jwt.claim.sub', v_coord_1::TEXT, TRUE);
  SELECT COUNT(*) INTO v_count FROM public.jrv WHERE recinto_id = v_recinto_2;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FALLO TEST 4: Coordinador de recinto 1 pudo leer mesas del recinto 2!';
  END IF;

  -- TEST 5 (R6 / ADR-008): guardar_acta rechaza totales incoherentes si no es OBSERVADA
  PERFORM set_config('request.jwt.claim.sub', v_veedor_a::TEXT, TRUE);
  v_fallo := FALSE;
  BEGIN
    PERFORM public.guardar_acta(
      v_jrv_1, 'alcalde',
      jsonb_build_array(jsonb_build_object('candidatura_id', v_cand_1, 'votos', 10)),
      1, 1, 99, 'rec/jrv/alcalde.jpg', -0.18, -78.48, 10, now(), TRUE, FALSE, '', gen_random_uuid(), NULL
    );
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%TOTALES_INCONSISTENTES%' THEN
      v_fallo := TRUE;
    END IF;
  END;
  IF NOT v_fallo THEN
    RAISE EXCEPTION 'FALLO TEST 5: guardar_acta aceptó totales incoherentes!';
  END IF;

  -- TEST 6 (R10 / ADR-006): guardar_acta válido + control de conflicto por version_base
  PERFORM public.guardar_acta(
    v_jrv_1, 'alcalde',
    jsonb_build_array(jsonb_build_object('candidatura_id', v_cand_1, 'votos', 10)),
    2, 3, 15, 'rec/jrv/alcalde.jpg', -0.18, -78.48, 10, now(), TRUE, FALSE, '', gen_random_uuid(), NULL
  );

  -- Simular que el coordinador corrige el acta (sube a version 2)
  PERFORM set_config('request.jwt.claim.sub', v_coord_1::TEXT, TRUE);
  PERFORM public.guardar_acta(
    v_jrv_1, 'alcalde',
    jsonb_build_array(jsonb_build_object('candidatura_id', v_cand_1, 'votos', 12)),
    2, 1, 15, 'rec/jrv/alcalde.jpg', -0.18, -78.48, 10, now(), TRUE, FALSE, '', gen_random_uuid(), 1
  );

  -- Ahora el veedor intenta sincronizar con version_base = 1 -> debe disparar CONFLICTO_VERSION
  PERFORM set_config('request.jwt.claim.sub', v_veedor_a::TEXT, TRUE);
  v_fallo := FALSE;
  BEGIN
    PERFORM public.guardar_acta(
      v_jrv_1, 'alcalde',
      jsonb_build_array(jsonb_build_object('candidatura_id', v_cand_1, 'votos', 11)),
      2, 2, 15, 'rec/jrv/alcalde.jpg', -0.18, -78.48, 10, now(), TRUE, FALSE, '', gen_random_uuid(), 1
    );
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%CONFLICTO_VERSION%' THEN
      v_fallo := TRUE;
    END IF;
  END;
  IF NOT v_fallo THEN
    RAISE EXCEPTION 'FALLO TEST 6: No se detectó CONFLICTO_VERSION!';
  END IF;

  RAISE NOTICE 'TODOS LOS TESTS RLS E INTEGRIDAD (6/6) PASARON CORRECTAMENTE.';
END;
$$;

ROLLBACK;
