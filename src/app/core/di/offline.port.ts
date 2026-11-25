import type { Signal } from '@angular/core';

import type { ActaVoto, Dignidad, EstadoSyncLocal, GpsActa } from '../../domain/models';

export interface OutboxActaItem {
  clientUuid: string;
  jrvId: string;
  recintoId: string;
  jrvNumero: number;
  dignidad: Dignidad;
  votos: ActaVoto[];
  nulos: number;
  blancos: number;
  totalSufragantes: number;
  gps: GpsActa;
  esInconsistente: boolean;
  observacion: string;
  fotoLocalPath: string | null;
  fotoPathExistente: string | null;
  versionBase: number | null;
  estado: EstadoSyncLocal;
  intentos: number;
  ultimoError: string | null;
  creadoEn: string;
}

export interface EncolarActaInput {
  jrvId: string;
  recintoId: string;
  jrvNumero: number;
  dignidad: Dignidad;
  votos: ActaVoto[];
  nulos: number;
  blancos: number;
  totalSufragantes: number;
  gps: GpsActa;
  esInconsistente: boolean;
  observacion: string;
  nuevaFotoBlob: Blob | null;
  fotoPathExistente: string | null;
  versionBase: number | null;
}

export interface OutboxSyncPort {
  readonly enLinea: Signal<boolean>;
  readonly registros: Signal<OutboxActaItem[]>;
  readonly sincronizando: Signal<boolean>;
  readonly cantidadPendientes: Signal<number>;
  iniciarMonitoreo(): Promise<void>;
  encolarActa(input: EncolarActaInput): Promise<OutboxActaItem>;
  sincronizarPendientes(): Promise<number>;
  resolverConflictoConservarServidor(clientUuid: string): Promise<void>;
  resolverConflictoForzarLocal(clientUuid: string): Promise<void>;
  eliminarRegistro(clientUuid: string): Promise<void>;
}
