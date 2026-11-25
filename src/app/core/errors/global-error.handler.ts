import { type ErrorHandler, inject, Injectable } from '@angular/core';

import { ToastService } from '../ui/toast.service';

import { LoggerService } from './logger.service';
import { mapSupabaseError } from './supabase-error.mapper';

/**
 * ADR-005 / ADR-010:
 * Manejador global de errores no capturados. Registra el detalle con LoggerService
 * y muestra un toast comprensible en español sin exponer códigos técnicos.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);

  handleError(error: unknown): void {
    const appError = mapSupabaseError(error);
    this.logger.error('GlobalErrorHandler', appError.codigo, error);
    void this.toast.error(appError.mensajeUsuario);
  }
}
