import { InjectionToken } from '@angular/core';

import type { ActaRepository, JrvRepository, PhotoStorageRepository } from '../../domain/ports';

/**
 * ADR-004: Tokens de inyección para desacoplar features/services de las implementaciones en data/.
 */
export const JRV_REPOSITORY = new InjectionToken<JrvRepository>('JRV_REPOSITORY');
export const ACTA_REPOSITORY = new InjectionToken<ActaRepository>('ACTA_REPOSITORY');
export const PHOTO_STORAGE_REPOSITORY = new InjectionToken<PhotoStorageRepository>('PHOTO_STORAGE_REPOSITORY');
