import { describe, expect, it } from 'vitest';

import { evaluarConsistenciaActa } from './acta-consistency';

describe('evaluarConsistenciaActa (ADR-005 / R6)', () => {
  it('acepta un acta cuando suma de 5 organizaciones + nulos + blancos = totalSufragantes', () => {
    const res = evaluarConsistenciaActa({
      votosOrganizaciones: [40, 30, 20, 10, 5],
      nulos: 3,
      blancos: 2,
      totalSufragantes: 110,
      esInconsistente: false,
      observacion: '',
    });

    expect(res.valida).toBe(true);
    expect(res.diferencia).toBe(0);
    expect(res.estadoResultante).toBe('VALIDADA');
  });

  it('retorna estado CORREGIDA cuando cuadra y es corrección', () => {
    const res = evaluarConsistenciaActa({
      votosOrganizaciones: [10, 10, 10, 10, 10],
      nulos: 0,
      blancos: 0,
      totalSufragantes: 50,
      esInconsistente: false,
      observacion: '',
      esCorreccion: true,
    });

    expect(res.valida).toBe(true);
    expect(res.estadoResultante).toBe('CORREGIDA');
  });

  it('rechaza cuando faltan o sobran votos sin marcar inconsistencia', () => {
    const faltan = evaluarConsistenciaActa({
      votosOrganizaciones: [10, 10, 10, 10, 10],
      nulos: 2,
      blancos: 1,
      totalSufragantes: 60,
      esInconsistente: false,
      observacion: '',
    });
    expect(faltan.valida).toBe(false);
    expect(faltan.diferencia).toBe(-7);

    const sobran = evaluarConsistenciaActa({
      votosOrganizaciones: [20, 20, 10, 10, 10],
      nulos: 2,
      blancos: 1,
      totalSufragantes: 70,
      esInconsistente: false,
      observacion: '',
    });
    expect(sobran.valida).toBe(false);
    expect(sobran.diferencia).toBe(3);
  });

  it('rechaza OBSERVADA si la observación tiene menos de 10 caracteres', () => {
    const res = evaluarConsistenciaActa({
      votosOrganizaciones: [10, 10, 10, 10, 10],
      nulos: 0,
      blancos: 0,
      totalSufragantes: 55,
      esInconsistente: true,
      observacion: 'No cuadra',
    });

    expect(res.valida).toBe(false);
  });

  it('acepta OBSERVADA cuando se marca inconsistencia y la observación tiene >= 10 caracteres', () => {
    const res = evaluarConsistenciaActa({
      votosOrganizaciones: [10, 10, 10, 10, 10],
      nulos: 0,
      blancos: 0,
      totalSufragantes: 55,
      esInconsistente: true,
      observacion: 'El acta impresa presenta tachón en el total de sufragantes.',
    });

    expect(res.valida).toBe(true);
    expect(res.estadoResultante).toBe('OBSERVADA');
  });

  it('rechaza valores negativos o decimales', () => {
    const res = evaluarConsistenciaActa({
      votosOrganizaciones: [-1, 10, 10, 10, 10],
      nulos: 0,
      blancos: 0,
      totalSufragantes: 39,
      esInconsistente: false,
      observacion: '',
    });

    expect(res.valida).toBe(false);
  });
});
