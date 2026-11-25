import { InjectionToken } from '@angular/core';

import type {
  AccountsRepository,
  ActaRepository,
  DashboardRepository,
  JrvRepository,
  PhotoStorageRepository,
  RecintoRepository,
} from '../../domain/ports';

/**
 * ADR-004: Tokens de inyección para desacoplar features/services de las implementaciones en data/.
 */
export const JRV_REPOSITORY = new InjectionToken<JrvRepository>('JRV_REPOSITORY');
export const ACTA_REPOSITORY = new InjectionToken<ActaRepository>('ACTA_REPOSITORY');
export const PHOTO_STORAGE_REPOSITORY = new InjectionToken<PhotoStorageRepository>('PHOTO_STORAGE_REPOSITORY');
export const ACCOUNTS_REPOSITORY = new InjectionToken<AccountsRepository>('ACCOUNTS_REPOSITORY');
export const RECINTO_REPOSITORY = new InjectionToken<RecintoRepository>('RECINTO_REPOSITORY');
export const DASHBOARD_REPOSITORY = new InjectionToken<DashboardRepository>('DASHBOARD_REPOSITORY');
