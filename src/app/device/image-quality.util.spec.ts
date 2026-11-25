import { describe, expect, it } from 'vitest';

import { calcularCalidadPixeles } from './image-quality.util';

function crearImagenTablero(width: number, height: number, paso: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const esBlanco = (Math.floor(x / paso) + Math.floor(y / paso)) % 2 === 0;
      const val = esBlanco ? 235 : 30;
      const idx = (y * width + x) * 4;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  return data;
}

function crearImagenPlana(width: number, height: number, valorGris: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    data[idx] = valorGris;
    data[idx + 1] = valorGris;
    data[idx + 2] = valorGris;
    data[idx + 3] = 255;
  }
  return data;
}

describe('calcularCalidadPixeles (ADR-003 / R7)', () => {
  it('acepta una imagen sintética con bordes nítidos', () => {
    const nitida = crearImagenTablero(64, 64, 4);
    const res = calcularCalidadPixeles(nitida, 64, 64, 100);

    expect(res.nitida).toBe(true);
    expect(res.varianza).toBeGreaterThan(100);
    expect(res.motivo).toBeNull();
  });

  it('rechaza una imagen desenfocada o sin contraste', () => {
    const borrosa = crearImagenPlana(64, 64, 140);
    const res = calcularCalidadPixeles(borrosa, 64, 64, 100);

    expect(res.nitida).toBe(false);
    expect(res.varianza).toBeLessThan(100);
    expect(res.motivo).toContain('borrosa');
  });

  it('rechaza una imagen completamente oscura', () => {
    const oscura = crearImagenPlana(64, 64, 10);
    const res = calcularCalidadPixeles(oscura, 64, 64, 100);

    expect(res.nitida).toBe(false);
    expect(res.motivo).toContain('oscura');
  });
});
