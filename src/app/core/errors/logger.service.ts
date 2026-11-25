import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

/**
 * ADR-010: Monitoreo ligero sin datos personales ni cédulas en producción.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  info(contexto: string, mensaje: string): void {
    if (!environment.production) {
      console.info(`[INFO][${contexto}] ${mensaje}`);
    }
  }

  warn(contexto: string, mensaje: string): void {
    console.warn(`[WARN][${contexto}] ${mensaje}`);
  }

  error(contexto: string, mensaje: string, detalle?: unknown): void {
    if (environment.production) {
      console.error(`[ERROR][${contexto}] ${mensaje}`);
    } else {
      console.error(`[ERROR][${contexto}] ${mensaje}`, detalle);
    }
  }
}
