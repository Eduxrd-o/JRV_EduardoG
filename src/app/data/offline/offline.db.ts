import Dexie, { type Table } from 'dexie';

import type { OutboxActaItem } from '../../core/di/offline.port';

/**
 * ADR-006 (R10): Base de datos local IndexedDB con Dexie para la cola de actas pendientes.
 */
export class JrvOfflineDatabase extends Dexie {
  outboxActas!: Table<OutboxActaItem, string>;

  constructor() {
    super('jrv_eduardog_offline_db');
    this.version(1).stores({
      outboxActas: 'clientUuid, estado, jrvId, creadoEn',
    });
  }
}

export const offlineDb = new JrvOfflineDatabase();
