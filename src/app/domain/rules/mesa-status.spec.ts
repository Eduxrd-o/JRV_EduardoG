import { describe, expect, it } from 'vitest';

import { calcularEstadoJrv } from './mesa-status';

describe('calcularEstadoJrv (ADR-004)', () => {
  it('devuelve PENDIENTE sin actas', () => {
    expect(calcularEstadoJrv([])).toBe('PENDIENTE');
  });

  it('devuelve PARCIAL con una sola acta válida', () => {
    expect(calcularEstadoJrv(['VALIDADA'])).toBe('PARCIAL');
  });

  it('devuelve COMPLETA con dos actas válidas o corregidas', () => {
    expect(calcularEstadoJrv(['VALIDADA', 'CORREGIDA'])).toBe('COMPLETA');
  });

  it('devuelve OBSERVADA si al menos un acta está observada', () => {
    expect(calcularEstadoJrv(['VALIDADA', 'OBSERVADA'])).toBe('OBSERVADA');
  });
});
