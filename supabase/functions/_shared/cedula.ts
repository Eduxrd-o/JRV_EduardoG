/**
 * Validación de cédula ecuatoriana (módulo 10) en servidor (R2 / ADR-002 / ADR-005).
 */
export function validarCedulaEcuatoriana(cedula: string): boolean {
  const limpia = cedula.trim();
  if (!/^\d{10}$/.test(limpia)) {
    return false;
  }

  const provincia = Number.parseInt(limpia.slice(0, 2), 10);
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) {
    return false;
  }

  const tercerDigito = Number.parseInt(limpia[2], 10);
  if (tercerDigito >= 6) {
    return false;
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let prod = Number.parseInt(limpia[i], 10) * coeficientes[i];
    if (prod > 9) {
      prod -= 9;
    }
    suma += prod;
  }

  const verificadorEsperado = (10 - (suma % 10)) % 10;
  const verificadorReal = Number.parseInt(limpia[9], 10);

  return verificadorEsperado === verificadorReal;
}
