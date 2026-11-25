import { inject, Injectable } from '@angular/core';

import { ACTA_REPOSITORY, JRV_REPOSITORY, PHOTO_STORAGE_REPOSITORY } from '../../../core/di/repository.tokens';
import { AppError } from '../../../core/errors/app-error.model';
import { CameraService, type FotoCapturada } from '../../../device/camera.service';
import { GeolocationService, type ResultadoGps } from '../../../device/geolocation.service';
import type { Acta, ActaVoto, Candidatura, Dignidad, GpsActa, Jrv } from '../../../domain/models';
import { evaluarConsistenciaActa } from '../../../domain/rules';

export interface ContextoActa {
  jrv: Jrv;
  candidaturas: Candidatura[];
  actaExistente: Acta | null;
  fotoFirmadaUrl: string | null;
}

export interface GuardarActaInput {
  jrv: Jrv;
  dignidad: Dignidad;
  votos: ActaVoto[];
  nulos: number;
  blancos: number;
  totalSufragantes: number;
  esInconsistente: boolean;
  observacion: string;
  nuevaFotoBlob: Blob | null;
  fotoPathExistente: string | null;
  gps: GpsActa;
  versionBase: number | null;
}

/**
 * ADR-004 / ADR-005: Servicio de dominio para orquestar el registro y corrección de actas.
 * Reutilizable tanto por Veedor (R6) como por Coordinador de Recinto (R5).
 */
@Injectable({ providedIn: 'root' })
export class ActaFormService {
  private readonly jrvRepo = inject(JRV_REPOSITORY);
  private readonly actaRepo = inject(ACTA_REPOSITORY);
  private readonly photoRepo = inject(PHOTO_STORAGE_REPOSITORY);
  private readonly camera = inject(CameraService);
  private readonly geolocation = inject(GeolocationService);

  async cargarContexto(jrvId: string, dignidad: Dignidad): Promise<ContextoActa> {
    const [jrv, candidaturas, actaExistente] = await Promise.all([
      this.jrvRepo.obtenerPorId(jrvId),
      this.actaRepo.listarCandidaturas(dignidad),
      this.actaRepo.obtenerActaPorJrvYDignidad(jrvId, dignidad),
    ]);

    if (!jrv) {
      throw new AppError('PERMISO_DENEGADO', 'No se encontró la mesa o no tienes permiso para acceder a ella.');
    }

    let fotoFirmadaUrl: string | null = null;
    if (actaExistente?.fotoPath) {
      try {
        fotoFirmadaUrl = await this.photoRepo.obtenerUrlFirmada(actaExistente.fotoPath);
      } catch {
        fotoFirmadaUrl = null;
      }
    }

    return { jrv, candidaturas, actaExistente, fotoFirmadaUrl };
  }

  async capturarFoto(origen: 'camera' | 'gallery'): Promise<FotoCapturada | null> {
    return this.camera.capturarFotoActa(origen);
  }

  async capturarGps(): Promise<ResultadoGps> {
    return this.geolocation.obtenerUbicacionActa();
  }

  async guardarActa(input: GuardarActaInput): Promise<Acta> {
    const evaluacion = evaluarConsistenciaActa({
      votosOrganizaciones: input.votos.map((v) => v.votos),
      nulos: input.nulos,
      blancos: input.blancos,
      totalSufragantes: input.totalSufragantes,
      esInconsistente: input.esInconsistente,
      observacion: input.observacion,
      esCorreccion: input.versionBase !== null,
    });

    if (!evaluacion.valida) {
      throw new AppError('VALIDACION', evaluacion.mensaje);
    }

    let fotoPath = input.fotoPathExistente;
    if (input.nuevaFotoBlob) {
      fotoPath = await this.photoRepo.subirFotoActa(input.jrv.recintoId, input.jrv.id, input.dignidad, input.nuevaFotoBlob);
    }

    if (!fotoPath) {
      throw new AppError('VALIDACION', 'Debes capturar o subir una fotografía nítida del acta antes de guardar.');
    }

    const clientUuid = crypto.randomUUID();

    return this.actaRepo.guardarActa({
      jrvId: input.jrv.id,
      recintoId: input.jrv.recintoId,
      dignidad: input.dignidad,
      votos: input.votos,
      nulos: input.nulos,
      blancos: input.blancos,
      totalSufragantes: input.totalSufragantes,
      fotoPath,
      gps: input.gps,
      esInconsistente: input.esInconsistente,
      observacion: input.observacion,
      clientUuid,
      versionBase: input.versionBase,
    });
  }
}
