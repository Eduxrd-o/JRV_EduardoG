import { Injectable } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface EstadoPermiso {
  concedido: boolean;
  mensaje: string | null;
}

/**
 * ADR-003 (R7): Gestión explícita de permisos de cámara y ubicación en Android/Capacitor.
 */
@Injectable({ providedIn: 'root' })
export class DevicePermissionsService {
  async asegurarPermisoCamara(tipo: 'camera' | 'gallery'): Promise<EstadoPermiso> {
    if (!Capacitor.isNativePlatform()) {
      return { concedido: true, mensaje: null };
    }

    try {
      const actual = await Camera.checkPermissions();
      const clave = tipo === 'camera' ? 'camera' : 'photos';

      if (actual[clave] === 'granted' || actual[clave] === 'limited') {
        return { concedido: true, mensaje: null };
      }

      const solicitado = await Camera.requestPermissions({ permissions: [clave] });
      if (solicitado[clave] === 'granted' || solicitado[clave] === 'limited') {
        return { concedido: true, mensaje: null };
      }

      return {
        concedido: false,
        mensaje:
          tipo === 'camera'
            ? 'Permiso de cámara denegado. Actívalo en Ajustes → Aplicaciones → Control Electoral JRV → Permisos.'
            : 'Permiso de galería denegado. Actívalo en Ajustes → Aplicaciones → Control Electoral JRV → Permisos.',
      };
    } catch {
      return {
        concedido: false,
        mensaje: 'No se pudo verificar el permiso de cámara en este dispositivo.',
      };
    }
  }

  async asegurarPermisoUbicacion(): Promise<EstadoPermiso> {
    if (!Capacitor.isNativePlatform()) {
      return { concedido: true, mensaje: null };
    }

    try {
      const actual = await Geolocation.checkPermissions();
      if (actual.location === 'granted' || actual.coarseLocation === 'granted') {
        return { concedido: true, mensaje: null };
      }

      const solicitado = await Geolocation.requestPermissions();
      if (solicitado.location === 'granted' || solicitado.coarseLocation === 'granted') {
        return { concedido: true, mensaje: null };
      }

      return {
        concedido: false,
        mensaje:
          'Permiso de ubicación denegado. Puedes activarlo en Ajustes o guardar el acta marcada como "Ubicación no comprobable".',
      };
    } catch {
      return {
        concedido: false,
        mensaje: 'No se pudo verificar el permiso de ubicación en el dispositivo.',
      };
    }
  }
}
