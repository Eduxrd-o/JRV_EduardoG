import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import {
  evaluarConsistenciaActa,
  validarCedulaEcuatoriana,
  validarTelefonoEcuatoriano,
} from '../../domain/rules';

export const CONTRASENA_INICIAL = 'Ecuador2026';

export function cedulaEcuatorianaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = String(control.value ?? '').trim();
    if (!valor) {
      return null;
    }
    return validarCedulaEcuatoriana(valor) ? null : { cedulaInvalida: true };
  };
}

export function telefonoEcuatorianoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = String(control.value ?? '').trim();
    if (!valor) {
      return null;
    }
    return validarTelefonoEcuatoriano(valor) ? null : { telefonoInvalido: true };
  };
}

export function nuevaClaveValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = String(control.value ?? '');
    if (!valor) {
      return null;
    }
    if (valor.length < 8) {
      return { claveCorta: true };
    }
    if (valor === CONTRASENA_INICIAL) {
      return { claveIgualInicial: true };
    }
    return null;
  };
}

export function consistenciaActaValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const votosCtrl = group.get('votos');
    const votosArray = Array.isArray(votosCtrl?.value) ? (votosCtrl.value as number[]) : [];
    const nulos = Number(group.get('nulos')?.value ?? 0);
    const blancos = Number(group.get('blancos')?.value ?? 0);
    const totalSufragantes = Number(group.get('totalSufragantes')?.value ?? 0);
    const esInconsistente = Boolean(group.get('esInconsistente')?.value);
    const observacion = String(group.get('observacion')?.value ?? '');

    const resultado = evaluarConsistenciaActa({
      votosOrganizaciones: votosArray.map((v) => Number(v ?? 0)),
      nulos,
      blancos,
      totalSufragantes,
      esInconsistente,
      observacion,
    });

    if (resultado.valida) {
      return null;
    }

    return {
      consistenciaActa: {
        mensaje: resultado.mensaje,
        diferencia: resultado.diferencia,
        sumaCalculada: resultado.sumaCalculada,
      },
    };
  };
}
