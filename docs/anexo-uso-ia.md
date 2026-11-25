# Anexo de Uso de Inteligencia Artificial

**Estudiante:** Eduardo Fabricio Ganchala Castillo · **Equipo 6**  
**Proyecto:** Control Electoral JRV (Ionic Angular Standalone + Capacitor + Supabase)

---

## 1. Herramientas utilizadas

| Herramienta | Propósito principal |
|---|---|
| **Gemini (Google)** | Análisis comparativo inicial para propuestas ADR-001 a ADR-010 (Supabase vs. Firebase, RLS, Laplaciano, Dexie). |
| **Antigravity (asistente de desarrollo en IDE)** | Generación asistida de migraciones SQL/RLS, Edge Functions, capas Angular standalone, pruebas unitarias y verificación con `ng build`, `ng lint` y `ng test`. |

---

## 2. Ejemplos relevantes de consultas, aceptación/descarte y verificación humana

| # | Área | Consulta realizada | Qué se aceptó / descartó | Verificación y correcciones humanas |
|---|---|---|---|---|
| 1 | **Arquitectura y ADRs (`ADR-001` a `ADR-010`)** | Comparación técnica de Ionic Angular vs. React, Supabase vs. Firebase y adaptación de los 4 ADRs consensuados de Josué Ortiz (`ADR-003`, `ADR-004`, `ADR-005`, `ADR-010`) hacia Supabase. | **Aceptado parcialmente:** se descartó Firebase por el plan Blaze y limitaciones de joins en reglas; se adaptaron los puertos de `ADR-004` y el Nivel 2 de pruebas de `ADR-010` a Postgres/RLS. | Se verificó en consenso grupal (reunión grabada) y con la regla ESLint `no-restricted-imports` en `eslint.config.js` que ninguna página importe `@supabase/*`. |
| 2 | **Esquema SQL, RLS y Edge Functions (`ADR-002`, `ADR-008`)** | Diseño de tablas normalizadas, RPC `email_por_cedula`, RPC transaccional `guardar_acta` con control de versión y Edge Functions sin exponer `service_role`. | **Aceptado y ajustado:** se descartó el autorregistro público y el correo sintético `cedula@dominio` para preservar recuperación por correo real (R3). | Se ejecutaron las migraciones y `seed.sql` en Supabase; al correr `supabase/tests/rls.sql` se detectó colisión de cédula `1710034065` con el usuario bootstrap y se corrigieron las cédulas sintéticas de prueba (`9900000001..04`). |
| 3 | **Validaciones de dominio (`ADR-005`)** | Algoritmo módulo 10 para cédula ecuatoriana, consistencia de actas (incluyendo `OBSERVADA`) y pruebas unitarias en Vitest. | **Aceptado:** validadores puros en `src/app/domain/rules/` sin dependencias de Angular/Supabase. | Al correr `npm run test:unit`, la prueba unitaria detectó un dígito verificador incorrecto en el caso de prueba de provincia 30 (`3000000007` → corregido a `3000000004`). Todas las 29 pruebas quedaron en verde. |
| 4 | **Cámara, nitidez y GPS (`ADR-003`)** | Implementación de varianza del Laplaciano 3×3 en `<canvas>` y gestión de permisos con `@capacitor/camera` y `@capacitor/geolocation`. | **Ajustado por consenso:** se modificó la propuesta original (que bloqueaba guardar sin GPS y restringía solo a cámara) para permitir cámara o galería y etiquetar actas sin señal como *«Ubicación no comprobable»*. | Verificado con `image-quality.util.spec.ts` (imágenes sintéticas nítida, borrosa y oscura) y configuración de permisos en `AndroidManifest.xml`. |
| 5 | **Offline y conflictos (`ADR-006 / R10`)** | Cola local con Dexie, almacenamiento de fotos con `@capacitor/filesystem`, reconexión con `@capacitor/network` y resolución de conflictos por `version`. | **Aceptado:** política determinista donde prevalece la versión del coordinador o el veedor decide enviar su copia local. | Verificado mediante pruebas unitarias con mocks (`acta-form.service.spec.ts`) y prueba SQL de `CONFLICTO_VERSION` en `supabase/tests/rls.sql`. |
| 6 | **Compilación y calidad** | Revisión de errores estrictos de TypeScript (`strict: true`), imports de Ionic 9 y advertencias de build/ESLint. | **Aceptado:** corrección de tipos (`Promise<void>`, `type ElementRef`), limpieza de imports no usados y configuración de `allowedCommonJsDependencies` para Leaflet. | Verificado ejecutando manualmente `npm run test:unit`, `npm run eslint`, `npm run build` y `npx cap sync android` con 0 errores. |

---

## 3. Declaración de comprensión y dominio técnico

Todo el código generado con asistencia de IA fue revisado, ejecutado en entorno real (Supabase + Angular/Ionic + Capacitor Android) y validado mediante pruebas unitarias, pruebas SQL de RLS y compilación nativa. La configuración de secretos se mantuvo fuera del repositorio mediante `git update-index --skip-worktree` y variables de entorno de servidor en Edge Functions.
