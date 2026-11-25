import { describe, expect, it } from 'vitest';

import { mapSupabaseError } from './supabase-error.mapper';

describe('mapSupabaseError (ADR-005 / ADR-010)', () => {
  it('traduce credenciales inválidas a mensaje en español', () => {
    const err = mapSupabaseError({ message: 'Invalid login credentials' });
    expect(err.codigo).toBe('CREDENCIALES_INVALIDAS');
    expect(err.mensajeUsuario).toContain('Cédula o contraseña');
  });

  it('traduce error RLS 42501 a PERMISO_DENEGADO', () => {
    const err = mapSupabaseError({ code: '42501', message: 'new row violates row-level security policy' });
    expect(err.codigo).toBe('PERMISO_DENEGADO');
  });

  it('traduce CONFLICTO_VERSION de guardar_acta', () => {
    const err = mapSupabaseError({ message: 'CONFLICTO_VERSION: servidor=2 base=1' });
    expect(err.codigo).toBe('CONFLICTO_VERSION');
  });

  it('traduce fallos de red a SIN_CONEXION', () => {
    const err = mapSupabaseError(new Error('Failed to fetch'));
    expect(err.codigo).toBe('SIN_CONEXION');
  });
});
