import { inject, Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { environment } from '../../environments/environment';
import { AppError } from '../core/errors/app-error.model';

import { DevicePermissionsService } from './device-permissions.service';
import { evaluarNitidezDesdeDataUrl, type ResultadoCalidadImagen } from './image-quality.util';

export interface FotoCapturada {
  dataUrl: string;
  blob: Blob;
  calidad: ResultadoCalidadImagen;
}

/**
 * ADR-003 + Acta de consenso (R7):
 * Permite capturar la foto del acta desde cámara o galería y comprueba su nitidez
 * con la varianza del Laplaciano antes de aceptarla.
 */
@Injectable({ providedIn: 'root' })
export class CameraService {
  private readonly permisos = inject(DevicePermissionsService);

  async capturarFotoActa(origen: 'camera' | 'gallery'): Promise<FotoCapturada | null> {
    const permiso = await this.permisos.asegurarPermisoCamara(origen);
    if (!permiso.concedido) {
      throw new AppError('PERMISO_DENEGADO', permiso.mensaje ?? 'Permiso de cámara denegado.');
    }

    try {
      const photo = await Camera.getPhoto({
        source: origen === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        resultType: CameraResultType.DataUrl,
        quality: 70,
        width: 1600,
        correctOrientation: true,
        saveToGallery: false,
      });

      if (!photo.dataUrl) {
        return null;
      }

      const calidad = await evaluarNitidezDesdeDataUrl(photo.dataUrl, environment.sharpnessThreshold);
      const blob = await this.dataUrlABlob(photo.dataUrl);

      return {
        dataUrl: photo.dataUrl,
        blob,
        calidad,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (msg.includes('cancel') || msg.includes('no image picked')) {
        return null;
      }
      throw new AppError('DESCONOCIDO', 'No se pudo obtener la fotografía del acta. Intenta nuevamente.', error);
    }
  }

  async dataUrlABlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return res.blob();
  }
}
