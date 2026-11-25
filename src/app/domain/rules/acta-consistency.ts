import type { EstadoActa } from '../models';

export interface EvaluacionActaInput {
  votosOrganizaciones: readonly number[];
  nulos: number;
  blancos: number;
  totalSufragantes: number;
  esInconsistente: boolean;
  observacion: string;
  esCorreccion?: boolean;
}

export interface EvaluacionActaResultado {
  valida: boolean;
  sumaCalculada: number;
  diferencia: number;
  estadoResultante: EstadoActa | null;
  mensaje: string;
}

/**
 * ADR-005 / ADR-008 / R6:
 * Verifica que Σ votos(5 organizaciones) + nulos + blancos === totalSufragantes.
 * Si el acta física no cuadra, solo permite guardar si se marca inconsistencia física
 * con una observación obligatoria de al menos 10 caracteres (estado OBSERVADA).
 */
export function evaluarConsistenciaActa(input: EvaluacionActaInput): EvaluacionActaResultado {
  const todosValores = [...input.votosOrganizaciones, input.nulos, input.blancos, input.totalSufragantes];
  const hayInvalido = todosValores.some((v) => !Number.isInteger(v) || v < 0);

  if (hayInvalido) {
    return {
      valida: false,
      sumaCalculada: 0,
      diferencia: 0,
      estadoResultante: null,
      mensaje: 'Todos los conteos deben ser números enteros mayores o iguales a 0.',
    };
  }

  const sumaOrganizaciones = input.votosOrganizaciones.reduce((acc, v) => acc + v, 0);
  const sumaCalculada = sumaOrganizaciones + input.nulos + input.blancos;
  const diferencia = sumaCalculada - input.totalSufragantes;

  if (diferencia === 0) {
    return {
      valida: true,
      sumaCalculada,
      diferencia: 0,
      estadoResultante: input.esCorreccion ? 'CORREGIDA' : 'VALIDADA',
      mensaje: 'Los totales del acta cuadran exactamente.',
    };
  }

  const textoDiferencia =
    diferencia > 0
      ? `Sobran ${diferencia} voto(s) respecto al total de sufragantes.`
      : `Faltan ${Math.abs(diferencia)} voto(s) para igualar el total de sufragantes.`;

  if (input.esInconsistente) {
    if (input.observacion.trim().length < 10) {
      return {
        valida: false,
        sumaCalculada,
        diferencia,
        estadoResultante: null,
        mensaje: `${textoDiferencia} Escriba una observación de al menos 10 caracteres para registrar como OBSERVADA.`,
      };
    }

    return {
      valida: true,
      sumaCalculada,
      diferencia,
      estadoResultante: 'OBSERVADA',
      mensaje: `${textoDiferencia} Se registrará como OBSERVADA para revisión del coordinador.`,
    };
  }

  return {
    valida: false,
    sumaCalculada,
    diferencia,
    estadoResultante: null,
    mensaje: textoDiferencia,
  };
}
