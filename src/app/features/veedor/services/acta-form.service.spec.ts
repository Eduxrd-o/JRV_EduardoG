import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import type { OutboxSyncPort } from '../../../core/di/offline.port';
import {
  ACTA_REPOSITORY,
  JRV_REPOSITORY,
  OUTBOX_SYNC_PORT,
  PHOTO_STORAGE_REPOSITORY,
} from '../../../core/di/repository.tokens';
import { CameraService } from '../../../device/camera.service';
import { GeolocationService } from '../../../device/geolocation.service';
import type { Acta, Jrv } from '../../../domain/models';
import type { ActaRepository, JrvRepository, PhotoStorageRepository } from '../../../domain/ports';

import { ActaFormService } from './acta-form.service';

const JRV_DEMO: Jrv = {
  id: 'jrv-1',
  recintoId: 'rec-1',
  numero: 1,
  veedorId: 'veedor-1',
  estado: 'PENDIENTE',
};

const ACTA_MOCK: Acta = {
  id: 'acta-1',
  jrvId: 'jrv-1',
  dignidad: 'alcalde',
  votos: [{ candidaturaId: 'c1', votos: 50 }],
  nulos: 2,
  blancos: 3,
  totalSufragantes: 55,
  fotoPath: 'rec-1/jrv-1/alcalde.jpg',
  gps: { lat: -0.18, lng: -78.48, precisionM: 12, capturadoEn: '2026-11-25T10:00:00Z', ubicacionComprobable: true },
  estado: 'VALIDADA',
  observacion: null,
  version: 1,
  clientUuid: 'uuid-1',
  actualizadoPor: 'veedor-1',
  actualizadoEn: '2026-11-25T10:00:00Z',
};

function setupService(enLineaInicial: boolean) {
  const jrvRepo: Partial<JrvRepository> = {
    obtenerPorId: vi.fn().mockResolvedValue(JRV_DEMO),
  };
  const actaRepo: Partial<ActaRepository> = {
    guardarActa: vi.fn().mockResolvedValue(ACTA_MOCK),
  };
  const photoRepo: Partial<PhotoStorageRepository> = {
    subirFotoActa: vi.fn().mockResolvedValue('rec-1/jrv-1/alcalde.jpg'),
  };
  const outbox: Partial<OutboxSyncPort> = {
    enLinea: signal(enLineaInicial).asReadonly(),
    encolarActa: vi.fn().mockResolvedValue({ clientUuid: 'offline-1' }),
  };

  TestBed.configureTestingModule({
    providers: [
      ActaFormService,
      { provide: JRV_REPOSITORY, useValue: jrvRepo },
      { provide: ACTA_REPOSITORY, useValue: actaRepo },
      { provide: PHOTO_STORAGE_REPOSITORY, useValue: photoRepo },
      { provide: OUTBOX_SYNC_PORT, useValue: outbox },
      { provide: CameraService, useValue: {} },
      { provide: GeolocationService, useValue: {} },
    ],
  });

  return {
    service: TestBed.inject(ActaFormService),
    actaRepo,
    photoRepo,
    outbox,
  };
}

describe('ActaFormService (ADR-004 / ADR-006 / ADR-010)', () => {
  it('rechaza totales inconsistentes sin marca OBSERVADA antes de llamar al repositorio', async () => {
    const { service, actaRepo } = setupService(true);

    await expect(
      service.guardarActa({
        jrv: JRV_DEMO,
        dignidad: 'alcalde',
        votos: [{ candidaturaId: 'c1', votos: 40 }],
        nulos: 2,
        blancos: 3,
        totalSufragantes: 55,
        esInconsistente: false,
        observacion: '',
        nuevaFotoBlob: new Blob(['img'], { type: 'image/jpeg' }),
        fotoPathExistente: null,
        gps: ACTA_MOCK.gps,
        versionBase: null,
      }),
    ).rejects.toThrow(/Faltan 10 voto/);

    expect(actaRepo.guardarActa).not.toHaveBeenCalled();
  });

  it('sube la foto y guarda en Supabase cuando hay conexión', async () => {
    const { service, actaRepo, photoRepo } = setupService(true);

    const res = await service.guardarActa({
      jrv: JRV_DEMO,
      dignidad: 'alcalde',
      votos: [{ candidaturaId: 'c1', votos: 50 }],
      nulos: 2,
      blancos: 3,
      totalSufragantes: 55,
      esInconsistente: false,
      observacion: '',
      nuevaFotoBlob: new Blob(['img'], { type: 'image/jpeg' }),
      fotoPathExistente: null,
      gps: ACTA_MOCK.gps,
      versionBase: null,
    });

    expect(res.sincronizada).toBe(true);
    expect(photoRepo.subirFotoActa).toHaveBeenCalledTimes(1);
    expect(actaRepo.guardarActa).toHaveBeenCalledTimes(1);
  });

  it('encola localmente en Dexie/Filesystem cuando no hay conexión (R10)', async () => {
    const { service, actaRepo, outbox } = setupService(false);

    const res = await service.guardarActa({
      jrv: JRV_DEMO,
      dignidad: 'alcalde',
      votos: [{ candidaturaId: 'c1', votos: 50 }],
      nulos: 2,
      blancos: 3,
      totalSufragantes: 55,
      esInconsistente: false,
      observacion: '',
      nuevaFotoBlob: new Blob(['img'], { type: 'image/jpeg' }),
      fotoPathExistente: null,
      gps: ACTA_MOCK.gps,
      versionBase: null,
    });

    expect(res.sincronizada).toBe(false);
    expect(outbox.encolarActa).toHaveBeenCalledTimes(1);
    expect(actaRepo.guardarActa).not.toHaveBeenCalled();
  });
});
