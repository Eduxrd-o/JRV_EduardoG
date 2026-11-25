import { computed, inject, Injectable, signal } from '@angular/core';
import { Network } from '@capacitor/network';

import type { EncolarActaInput, OutboxActaItem, OutboxSyncPort } from '../../core/di/offline.port';
import { ACTA_REPOSITORY, PHOTO_STORAGE_REPOSITORY } from '../../core/di/repository.tokens';
import { LoggerService } from '../../core/errors/logger.service';
import { mapSupabaseError } from '../../core/errors/supabase-error.mapper';
import { ToastService } from '../../core/ui/toast.service';

import { offlineDb } from './offline.db';
import { PhotoLocalStore } from './photo-local.store';

/**
 * ADR-006 (R10):
 * Cola local de sincronización en IndexedDB (Dexie) + fotos en @capacitor/filesystem
 * + detección de red con @capacitor/network + resolución de conflictos por versión.
 */
@Injectable({ providedIn: 'root' })
export class OutboxSyncService implements OutboxSyncPort {
  private readonly actaRepo = inject(ACTA_REPOSITORY);
  private readonly photoRepo = inject(PHOTO_STORAGE_REPOSITORY);
  private readonly localPhotos = inject(PhotoLocalStore);
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);

  private readonly _enLinea = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  private readonly _registros = signal<OutboxActaItem[]>([]);
  private readonly _sincronizando = signal<boolean>(false);

  readonly enLinea = this._enLinea.asReadonly();
  readonly registros = this._registros.asReadonly();
  readonly sincronizando = this._sincronizando.asReadonly();
  readonly cantidadPendientes = computed(
    () => this._registros().filter((r) => r.estado === 'pendiente' || r.estado === 'conflicto').length,
  );

  private monitoreando = false;

  async iniciarMonitoreo(): Promise<void> {
    if (this.monitoreando) {
      return;
    }
    this.monitoreando = true;
    await this.refrescarLista();

    try {
      const status = await Network.getStatus();
      this._enLinea.set(status.connected);

      await Network.addListener('networkStatusChange', (nuevoEstado) => {
        const previo = this._enLinea();
        this._enLinea.set(nuevoEstado.connected);
        if (!previo && nuevoEstado.connected) {
          this.logger.info('OutboxSyncService', 'Conexión recuperada: iniciando sincronización automática.');
          void this.sincronizarPendientes();
        }
      });

      if (status.connected && this.cantidadPendientes() > 0) {
        void this.sincronizarPendientes();
      }
    } catch {
      this.logger.warn('OutboxSyncService', 'No se pudo suscribir a @capacitor/network; se usa navigator.onLine.');
    }
  }

  async encolarActa(input: EncolarActaInput): Promise<OutboxActaItem> {
    const clientUuid = crypto.randomUUID();
    let fotoLocalPath: string | null = null;

    if (input.nuevaFotoBlob) {
      fotoLocalPath = await this.localPhotos.guardarFotoLocal(clientUuid, input.nuevaFotoBlob);
    }

    const item: OutboxActaItem = {
      clientUuid,
      jrvId: input.jrvId,
      recintoId: input.recintoId,
      jrvNumero: input.jrvNumero,
      dignidad: input.dignidad,
      votos: input.votos,
      nulos: input.nulos,
      blancos: input.blancos,
      totalSufragantes: input.totalSufragantes,
      gps: input.gps,
      esInconsistente: input.esInconsistente,
      observacion: input.observacion,
      fotoLocalPath,
      fotoPathExistente: input.fotoPathExistente,
      versionBase: input.versionBase,
      estado: 'pendiente',
      intentos: 0,
      ultimoError: null,
      creadoEn: new Date().toISOString(),
    };

    await offlineDb.outboxActas.put(item);
    await this.refrescarLista();
    return item;
  }

  async sincronizarPendientes(): Promise<number> {
    if (this._sincronizando() || !this._enLinea()) {
      return 0;
    }

    this._sincronizando.set(true);
    let sincronizadas = 0;

    try {
      const pendientes = await offlineDb.outboxActas.where('estado').equals('pendiente').toArray();

      for (const item of pendientes) {
        const ok = await this.sincronizarUno(item);
        if (ok) {
          sincronizadas++;
        }
      }

      if (sincronizadas > 0) {
        await this.toast.exito(`${sincronizadas} acta(s) pendiente(s) sincronizada(s) automáticamente.`);
      }
    } finally {
      this._sincronizando.set(false);
      await this.refrescarLista();
    }

    return sincronizadas;
  }

  async resolverConflictoConservarServidor(clientUuid: string): Promise<void> {
    const item = await offlineDb.outboxActas.get(clientUuid);
    if (item) {
      await this.localPhotos.eliminarFotoLocal(item.fotoLocalPath);
      await offlineDb.outboxActas.delete(clientUuid);
      await this.refrescarLista();
    }
  }

  async resolverConflictoForzarLocal(clientUuid: string): Promise<void> {
    const item = await offlineDb.outboxActas.get(clientUuid);
    if (!item) {
      return;
    }

    await offlineDb.outboxActas.update(clientUuid, {
      versionBase: null,
      estado: 'pendiente',
      ultimoError: null,
    });
    await this.refrescarLista();
    await this.sincronizarPendientes();
  }

  async eliminarRegistro(clientUuid: string): Promise<void> {
    const item = await offlineDb.outboxActas.get(clientUuid);
    if (item) {
      await this.localPhotos.eliminarFotoLocal(item.fotoLocalPath);
      await offlineDb.outboxActas.delete(clientUuid);
      await this.refrescarLista();
    }
  }

  private async sincronizarUno(item: OutboxActaItem): Promise<boolean> {
    await offlineDb.outboxActas.update(item.clientUuid, {
      estado: 'sincronizando',
      intentos: item.intentos + 1,
    });
    await this.refrescarLista();

    try {
      let fotoPath = item.fotoPathExistente;
      if (item.fotoLocalPath) {
        const blob = await this.localPhotos.leerFotoLocal(item.fotoLocalPath);
        fotoPath = await this.photoRepo.subirFotoActa(item.recintoId, item.jrvId, item.dignidad, blob);
      }

      if (!fotoPath) {
        throw new Error('Falta la fotografía del acta en la cola local.');
      }

      await this.actaRepo.guardarActa({
        jrvId: item.jrvId,
        recintoId: item.recintoId,
        dignidad: item.dignidad,
        votos: item.votos,
        nulos: item.nulos,
        blancos: item.blancos,
        totalSufragantes: item.totalSufragantes,
        fotoPath,
        gps: item.gps,
        esInconsistente: item.esInconsistente,
        observacion: item.observacion,
        clientUuid: item.clientUuid,
        versionBase: item.versionBase,
      });

      await this.localPhotos.eliminarFotoLocal(item.fotoLocalPath);
      await offlineDb.outboxActas.update(item.clientUuid, {
        estado: 'sincronizada',
        fotoLocalPath: null,
        ultimoError: null,
      });
      return true;
    } catch (error) {
      const appErr = mapSupabaseError(error);

      if (appErr.codigo === 'CONFLICTO_VERSION') {
        await offlineDb.outboxActas.update(item.clientUuid, {
          estado: 'conflicto',
          ultimoError: appErr.mensajeUsuario,
        });
        await this.toast.advertencia(`Conflicto de versión en JRV #${item.jrvNumero} (${item.dignidad}).`);
        return false;
      }

      if (appErr.codigo === 'SIN_CONEXION') {
        await offlineDb.outboxActas.update(item.clientUuid, {
          estado: 'pendiente',
          ultimoError: appErr.mensajeUsuario,
        });
        return false;
      }

      // Errores 4xx / validación / permisos no se reintentan automáticamente (ADR-006)
      await offlineDb.outboxActas.update(item.clientUuid, {
        estado: 'error',
        ultimoError: appErr.mensajeUsuario,
      });
      return false;
    }
  }

  private async refrescarLista(): Promise<void> {
    const todos = await offlineDb.outboxActas.orderBy('creadoEn').reverse().toArray();
    this._registros.set(todos);
  }
}
