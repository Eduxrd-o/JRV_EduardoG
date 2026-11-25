-- ============================================================================
-- Seed inicial (R1): Provincia Pichincha, Cantón Quito
-- 4 recintos electorales (con JRVs generadas automáticamente por trigger),
-- 5 organizaciones políticas, 5 candidaturas a Alcaldía y 5 a Prefectura.
-- ============================================================================

INSERT INTO public.recintos (provincia, canton, parroquia, nombre, num_jrv, lat, lng)
VALUES
  ('Pichincha', 'Quito', 'Iñaquito', 'Unidad Educativa Sebastián de Benalcázar', 4, -0.1753, -78.4812),
  ('Pichincha', 'Quito', 'La Mariscal', 'Escuela Politécnica Nacional - Edificio EARME', 4, -0.2102, -78.4889),
  ('Pichincha', 'Quito', 'Cotocollao', 'Colegio Nacional 24 de Mayo', 3, -0.1145, -78.4976),
  ('Pichincha', 'Quito', 'Chillogallo', 'Unidad Educativa Fiscal Quito Sur', 3, -0.2815, -78.5542)
ON CONFLICT (canton, parroquia, nombre) DO NOTHING;

INSERT INTO public.organizaciones (nombre, lista)
VALUES
  ('Movimiento Unidad Democrática', 'Lista 1'),
  ('Partido Alianza Ciudadana', 'Lista 2'),
  ('Frente Progresista Andino', 'Lista 3'),
  ('Movimiento Renovación Nacional', 'Lista 4'),
  ('Coalición Futuro Pichincha', 'Lista 5')
ON CONFLICT (nombre) DO NOTHING;

-- 5 Candidaturas a Alcaldía de Quito
INSERT INTO public.candidaturas (organizacion_id, dignidad, nombre)
SELECT o.id, 'alcalde', v.candidato
FROM (VALUES
  ('Lista 1', 'María Fernanda Paredes'),
  ('Lista 2', 'Carlos Andrés Cevallos'),
  ('Lista 3', 'Sofía Alejandra Morales'),
  ('Lista 4', 'Diego Fernando Herrera'),
  ('Lista 5', 'Valeria Cristina Salazar')
) AS v(lista, candidato)
JOIN public.organizaciones o ON o.lista = v.lista
ON CONFLICT (organizacion_id, dignidad) DO NOTHING;

-- 5 Candidaturas a Prefectura de Pichincha
INSERT INTO public.candidaturas (organizacion_id, dignidad, nombre)
SELECT o.id, 'prefecto', v.candidato
FROM (VALUES
  ('Lista 1', 'Jorge Luis Zambrano'),
  ('Lista 2', 'Gabriela Patricia Viteri'),
  ('Lista 3', 'Esteban Mauricio Cárdenas'),
  ('Lista 4', 'Lucía Belén Andrade'),
  ('Lista 5', 'Roberto Xavier Maldonado')
) AS v(lista, candidato)
JOIN public.organizaciones o ON o.lista = v.lista
ON CONFLICT (organizacion_id, dignidad) DO NOTHING;
