import type { EstadoActa, EstadoJrv } from '../models';

/**
 * ADR-004 / ADR-005: Calcula el estado consolidado de una JRV a partir de sus actas registradas.
 */
export function calcularEstadoJrv(estadosActas: readonly EstadoActa[]): EstadoJrv {
  if (estadosActas.length === 0) {
    return 'PENDIENTE';
  }
  if (estadosActas.includes('OBSERVADA')) {
    return 'OBSERVADA';
  }
  if (estadosActas.length >= 2) {
    return 'COMPLETA';
  }
  return 'PARCIAL';
}
