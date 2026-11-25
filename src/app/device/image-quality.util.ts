export interface ResultadoCalidadImagen {
  nitida: boolean;
  varianza: number;
  brilloMedio: number;
  motivo: string | null;
}

export const UMBRAL_NITIDEZ_POR_DEFECTO = 100;
export const BRILLO_MINIMO_POR_DEFECTO = 35;

/**
 * ADR-003 (R7): Función pura para evaluar nitidez mediante la varianza del Laplaciano
 * con kernel 3x3 [0,1,0; 1,-4,1; 0,1,0] y brillo medio en escala de grises.
 */
export function calcularCalidadPixeles(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  umbralNitidez = UMBRAL_NITIDEZ_POR_DEFECTO,
  brilloMinimo = BRILLO_MINIMO_POR_DEFECTO,
): ResultadoCalidadImagen {
  if (width < 3 || height < 3 || rgba.length < width * height * 4) {
    return {
      nitida: false,
      varianza: 0,
      brilloMedio: 0,
      motivo: 'La imagen es demasiado pequeña para evaluar su nitidez.',
    };
  }

  const totalPixeles = width * height;
  const gris = new Float32Array(totalPixeles);
  let sumaBrillo = 0;

  for (let i = 0; i < totalPixeles; i++) {
    const idx = i * 4;
    const lum = 0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2];
    gris[i] = lum;
    sumaBrillo += lum;
  }

  const brilloMedio = sumaBrillo / totalPixeles;
  if (brilloMedio < brilloMinimo) {
    return {
      nitida: false,
      varianza: 0,
      brilloMedio: Math.round(brilloMedio * 10) / 10,
      motivo: 'La foto está demasiado oscura. Busca mejor iluminación y vuelve a tomarla.',
    };
  }

  const interiores = (width - 2) * (height - 2);
  let sumaLap = 0;
  let sumaLapCuadrado = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const c = y * width + x;
      const lap =
        gris[c - width] + gris[c + width] + gris[c - 1] + gris[c + 1] - 4 * gris[c];
      sumaLap += lap;
      sumaLapCuadrado += lap * lap;
    }
  }

  const mediaLap = sumaLap / interiores;
  const varianza = sumaLapCuadrado / interiores - mediaLap * mediaLap;
  const varianzaRedondeada = Math.round(varianza * 10) / 10;

  if (varianza < umbralNitidez) {
    return {
      nitida: false,
      varianza: varianzaRedondeada,
      brilloMedio: Math.round(brilloMedio * 10) / 10,
      motivo: 'La foto está borrosa; vuelva a tomarla con buena luz y sin mover el teléfono.',
    };
  }

  return {
    nitida: true,
    varianza: varianzaRedondeada,
    brilloMedio: Math.round(brilloMedio * 10) / 10,
    motivo: null,
  };
}

/**
 * Reduce la imagen a máximo ~500 px de ancho en un canvas y calcula su nitidez.
 */
export async function evaluarNitidezDesdeDataUrl(
  dataUrl: string,
  umbralNitidez = UMBRAL_NITIDEZ_POR_DEFECTO,
): Promise<ResultadoCalidadImagen> {
  const img = await cargarImagen(dataUrl);
  const maxAncho = 500;
  const escala = img.width > maxAncho ? maxAncho / img.width : 1;
  const width = Math.max(3, Math.round(img.width * escala));
  const height = Math.max(3, Math.round(img.height * escala));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto de canvas para comprobar nitidez.');
  }

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  return calcularCalidadPixeles(imageData.data, width, height, umbralNitidez);
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen capturada.'));
    img.src = src;
  });
}
