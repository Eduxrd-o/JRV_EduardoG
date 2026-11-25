import { inject, Injectable, signal } from '@angular/core';

import { ACCOUNTS_REPOSITORY, DASHBOARD_REPOSITORY, RECINTO_REPOSITORY } from '../../../core/di/repository.tokens';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import type { DashboardSnapshot, Estado, Perfil, Recinto } from '../../../domain/models';
import type { CrearCuentaInput, CrearRecintoInput } from '../../../domain/ports';

/**
 * ADR-005 / ADR-009 (R4): Store con Signals para el Coordinador Provincial.
 */
@Injectable({ providedIn: 'root' })
export class ProvincialStore {
  private readonly recintoRepo = inject(RECINTO_REPOSITORY);
  private readonly accountsRepo = inject(ACCOUNTS_REPOSITORY);
  private readonly dashboardRepo = inject(DASHBOARD_REPOSITORY);

  private readonly _recintos = signal<Estado<Recinto[]>>({ tipo: 'inactivo' });
  private readonly _coordinadores = signal<Estado<Perfil[]>>({ tipo: 'inactivo' });
  private readonly _dashboard = signal<Estado<DashboardSnapshot>>({ tipo: 'inactivo' });

  readonly recintos = this._recintos.asReadonly();
  readonly coordinadores = this._coordinadores.asReadonly();
  readonly dashboard = this._dashboard.asReadonly();

  async cargarTodo(): Promise<void> {
    await Promise.all([this.cargarRecintos(), this.cargarCoordinadores(), this.cargarDashboard()]);
  }

  async cargarRecintos(): Promise<void> {
    this._recintos.set({ tipo: 'cargando' });
    try {
      const lista = await this.recintoRepo.listarRecintos();
      this._recintos.set(lista.length > 0 ? { tipo: 'exito', datos: lista } : { tipo: 'vacio' });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this._recintos.set({
        tipo: 'error',
        mensaje: appErr.mensajeUsuario,
        reintentar: () => void this.cargarRecintos(),
      });
    }
  }

  async cargarCoordinadores(): Promise<void> {
    this._coordinadores.set({ tipo: 'cargando' });
    try {
      const lista = await this.accountsRepo.listarCoordinadoresRecinto();
      this._coordinadores.set(lista.length > 0 ? { tipo: 'exito', datos: lista } : { tipo: 'vacio' });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this._coordinadores.set({
        tipo: 'error',
        mensaje: appErr.mensajeUsuario,
        reintentar: () => void this.cargarCoordinadores(),
      });
    }
  }

  async cargarDashboard(): Promise<void> {
    this._dashboard.set({ tipo: 'cargando' });
    try {
      const snap = await this.dashboardRepo.cargarSnapshot();
      this._dashboard.set({ tipo: 'exito', datos: snap });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this._dashboard.set({
        tipo: 'error',
        mensaje: appErr.mensajeUsuario,
        reintentar: () => void this.cargarDashboard(),
      });
    }
  }

  async crearRecinto(input: CrearRecintoInput): Promise<Recinto> {
    const creado = await this.recintoRepo.crearRecinto(input);
    await Promise.all([this.cargarRecintos(), this.cargarDashboard()]);
    return creado;
  }

  async crearCoordinador(input: CrearCuentaInput): Promise<Perfil> {
    const creado = await this.accountsRepo.crearCoordinadorRecinto(input);
    await this.cargarCoordinadores();
    return creado;
  }

  async asignarRecintoACoordinador(coordinadorId: string, recintoId: string | null): Promise<void> {
    await this.accountsRepo.asignarRecintoACoordinador(coordinadorId, recintoId);
    await this.cargarCoordinadores();
  }
}
