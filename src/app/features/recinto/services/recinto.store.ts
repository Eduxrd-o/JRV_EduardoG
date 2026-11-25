import { inject, Injectable, signal } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCOUNTS_REPOSITORY, ACTA_REPOSITORY, JRV_REPOSITORY } from '../../../core/di/repository.tokens';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import type { Acta, Estado, Jrv, Perfil } from '../../../domain/models';
import type { CrearCuentaInput } from '../../../domain/ports';

/**
 * ADR-005 (R5): Store con Signals para el Coordinador de Recinto.
 */
@Injectable({ providedIn: 'root' })
export class RecintoStore {
  private readonly auth = inject(AuthService);
  private readonly jrvRepo = inject(JRV_REPOSITORY);
  private readonly actaRepo = inject(ACTA_REPOSITORY);
  private readonly accountsRepo = inject(ACCOUNTS_REPOSITORY);

  private readonly _mesas = signal<Estado<Jrv[]>>({ tipo: 'inactivo' });
  private readonly _veedores = signal<Estado<Perfil[]>>({ tipo: 'inactivo' });
  private readonly _actas = signal<Estado<Acta[]>>({ tipo: 'inactivo' });

  readonly mesas = this._mesas.asReadonly();
  readonly veedores = this._veedores.asReadonly();
  readonly actas = this._actas.asReadonly();

  async cargarTodo(): Promise<void> {
    await Promise.all([this.cargarMesas(), this.cargarVeedores(), this.cargarActas()]);
  }

  async cargarMesas(): Promise<void> {
    const recintoId = this.auth.perfil()?.recintoId;
    if (!recintoId) {
      this._mesas.set({ tipo: 'error', mensaje: 'Tu cuenta no tiene un recinto asignado todavía.' });
      return;
    }

    this._mesas.set({ tipo: 'cargando' });
    try {
      const lista = await this.jrvRepo.listarPorRecinto(recintoId);
      this._mesas.set(lista.length > 0 ? { tipo: 'exito', datos: lista } : { tipo: 'vacio' });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this._mesas.set({
        tipo: 'error',
        mensaje: appErr.mensajeUsuario,
        reintentar: () => void this.cargarMesas(),
      });
    }
  }

  async cargarVeedores(): Promise<void> {
    const recintoId = this.auth.perfil()?.recintoId;
    if (!recintoId) {
      this._veedores.set({ tipo: 'vacio' });
      return;
    }

    this._veedores.set({ tipo: 'cargando' });
    try {
      const lista = await this.accountsRepo.listarVeedoresPorRecinto(recintoId);
      this._veedores.set(lista.length > 0 ? { tipo: 'exito', datos: lista } : { tipo: 'vacio' });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this._veedores.set({
        tipo: 'error',
        mensaje: appErr.mensajeUsuario,
        reintentar: () => void this.cargarVeedores(),
      });
    }
  }

  async cargarActas(): Promise<void> {
    const recintoId = this.auth.perfil()?.recintoId;
    if (!recintoId) {
      this._actas.set({ tipo: 'vacio' });
      return;
    }

    this._actas.set({ tipo: 'cargando' });
    try {
      const lista = await this.actaRepo.listarActasPorRecinto(recintoId);
      this._actas.set(lista.length > 0 ? { tipo: 'exito', datos: lista } : { tipo: 'vacio' });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this._actas.set({
        tipo: 'error',
        mensaje: appErr.mensajeUsuario,
        reintentar: () => void this.cargarActas(),
      });
    }
  }

  async asignarVeedor(jrvId: string, veedorId: string | null): Promise<void> {
    await this.jrvRepo.asignarVeedor(jrvId, veedorId);
    await this.cargarMesas();
  }

  async crearVeedor(input: CrearCuentaInput): Promise<Perfil> {
    const creado = await this.accountsRepo.crearVeedor(input);
    await this.cargarVeedores();
    return creado;
  }
}
