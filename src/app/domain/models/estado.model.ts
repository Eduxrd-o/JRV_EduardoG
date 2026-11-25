/**
 * ADR-005 (R9): Modelo explícito de estado para todas las pantallas de datos.
 */
export type Estado<T> =
  | { tipo: 'inactivo' }
  | { tipo: 'cargando' }
  | { tipo: 'exito'; datos: T }
  | { tipo: 'vacio' }
  | { tipo: 'error'; mensaje: string; reintentar?: () => void };
