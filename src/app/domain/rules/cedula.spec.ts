import { describe, expect, it } from 'vitest';

import { validarCedulaEcuatoriana, validarTelefonoEcuatoriano } from './cedula';

describe('validarCedulaEcuatoriana (ADR-005 / R2)', () => {
  it('acepta cédulas ecuatorianas válidas', () => {
    expect(validarCedulaEcuatoriana('1710034065')).toBe(true);
    expect(validarCedulaEcuatoriana('0926687856')).toBe(true);
    expect(validarCedulaEcuatoriana('3000000004')).toBe(true); // provincia 30 (ecuatorianos en el exterior)
  });

  it('rechaza longitud incorrecta o caracteres no numéricos', () => {
    expect(validarCedulaEcuatoriana('171003406')).toBe(false);
    expect(validarCedulaEcuatoriana('17100340651')).toBe(false);
    expect(validarCedulaEcuatoriana('171003406A')).toBe(false);
  });

  it('rechaza código de provincia inválido (00 o 25..29)', () => {
    expect(validarCedulaEcuatoriana('0010034065')).toBe(false);
    expect(validarCedulaEcuatoriana('2510034065')).toBe(false);
  });

  it('rechaza tercer dígito >= 6', () => {
    expect(validarCedulaEcuatoriana('1760034065')).toBe(false);
  });

  it('rechaza dígito verificador incorrecto', () => {
    expect(validarCedulaEcuatoriana('1710034064')).toBe(false);
  });
});

describe('validarTelefonoEcuatoriano', () => {
  it('acepta celulares ecuatorianos de 10 dígitos iniciando en 09', () => {
    expect(validarTelefonoEcuatoriano('0987654321')).toBe(true);
  });

  it('rechaza números que no inician en 09 o con longitud errónea', () => {
    expect(validarTelefonoEcuatoriano('0223456789')).toBe(false);
    expect(validarTelefonoEcuatoriano('098765432')).toBe(false);
  });
});
