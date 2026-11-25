import { inject, Injectable, signal } from '@angular/core';

import { JRV_REPOSITORY } from '../../../core/di/repository.tokens';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import type { Estado, Jrv } from '../../../domain/models';

/**
 * ADR-005: Store con Signals para las mesas asignadas al veedor autenticado.
 * RLS garantiza que solo se devuelvan mesas con jrv.veedor_id = auth.uid().
 */
@Injectable({ providedIn: 'root' })
export class VeedorMesasStore {
  private readonly jrvRepo = inject(JRV_REPOSITORY);

  private readonly _estado = signal<Estado<Jrv[]>>({ tipo: 'inactivo' });
  readonly estado = this._estado.asReadonly();

  async cargarMesas(): Promise<void> {
    this._estado.set({ tipo: 'cargando' });
    try {
      const mesas = await this.jrvRepo.listarMisMesas();
      if (mesas.length === 0) {
        this._estado.set({ tipo: 'vacio' });
        return;
      }
      this._estado.set({ tipo: 'exito', datos: mesas });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this._estado.set({
        tipo: 'error',
        mensaje: appErr.mensajeUsuario,
        reintentar: () => void this.cargarMesas(),
      });
    }
  }
}
