import { inject, Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

import type { GpsActa } from '../domain/models';

import { DevicePermissionsService } from './device-permissions.service';

export interface ResultadoGps {
  gps: GpsActa;
  advertencia: string | null;
}

const GPS_NO_COMPROBABLE: GpsActa = {
  lat: null,
  lng: null,
  precisionM: null,
  capturadoEn: null,
  ubicacionComprobable: false,
};

/**
 * ADR-003 + Acta de consenso (R7):
 * Captura coordenadas GPS (lat, lng, precisionM, capturadoEn).
 * Si el permiso es denegado o el GPS falla, permite continuar etiquetando el acta
 * como "Ubicación no comprobable" (ubicacionComprobable = false).
 */
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly permisos = inject(DevicePermissionsService);

  async obtenerUbicacionActa(): Promise<ResultadoGps> {
    const permiso = await this.permisos.asegurarPermisoUbicacion();
    if (!permiso.concedido) {
      return {
        gps: { ...GPS_NO_COMPROBABLE },
        advertencia: permiso.mensaje ?? 'Ubicación no comprobable (permiso denegado).',
      };
    }

    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      return this.construirResultadoExito(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, false);
    } catch {
      // Mitigación ADR-003: en interiores reintenta última posición conocida (< 5 min)
      try {
        const posAprox = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 300000,
        });
        return this.construirResultadoExito(
          posAprox.coords.latitude,
          posAprox.coords.longitude,
          posAprox.coords.accuracy,
          true,
        );
      } catch {
        return {
          gps: { ...GPS_NO_COMPROBABLE },
          advertencia:
            'No se pudo obtener señal GPS. Puedes reintentar o guardar el acta con la etiqueta "Ubicación no comprobable".',
        };
      }
    }
  }

  private construirResultadoExito(
    lat: number,
    lng: number,
    accuracy: number,
    aproximada: boolean,
  ): ResultadoGps {
    const precisionM = Math.round(accuracy * 10) / 10;
    let advertencia: string | null = null;

    if (aproximada) {
      advertencia = `Ubicación aproximada obtenida (±${precisionM} m).`;
    } else if (precisionM > 100) {
      advertencia = `Precisión GPS baja (±${precisionM} m). Se registrará con aviso para el coordinador.`;
    }

    return {
      gps: {
        lat,
        lng,
        precisionM,
        capturadoEn: new Date().toISOString(),
        ubicacionComprobable: true,
      },
      advertencia,
    };
  }
}
