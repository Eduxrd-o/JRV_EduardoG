import { ErrorHandler } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import {
  ACCOUNTS_REPOSITORY,
  ACTA_REPOSITORY,
  DASHBOARD_REPOSITORY,
  JRV_REPOSITORY,
  OUTBOX_SYNC_PORT,
  PHOTO_STORAGE_REPOSITORY,
  RECINTO_REPOSITORY,
} from './app/core/di/repository.tokens';
import { GlobalErrorHandler } from './app/core/errors/global-error.handler';
import { SupabaseAccountsRepository } from './app/data/functions/supabase-accounts.repository';
import { OutboxSyncService } from './app/data/offline/outbox-sync.service';
import { SupabasePhotoStorageRepository } from './app/data/storage/supabase-photo-storage.repository';
import { SupabaseActaRepository } from './app/data/supabase/supabase-acta.repository';
import { SupabaseDashboardRepository } from './app/data/supabase/supabase-dashboard.repository';
import { SupabaseJrvRepository } from './app/data/supabase/supabase-jrv.repository';
import { SupabaseRecintoRepository } from './app/data/supabase/supabase-recinto.repository';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: JRV_REPOSITORY, useExisting: SupabaseJrvRepository },
    { provide: ACTA_REPOSITORY, useExisting: SupabaseActaRepository },
    { provide: PHOTO_STORAGE_REPOSITORY, useExisting: SupabasePhotoStorageRepository },
    { provide: ACCOUNTS_REPOSITORY, useExisting: SupabaseAccountsRepository },
    { provide: RECINTO_REPOSITORY, useExisting: SupabaseRecintoRepository },
    { provide: DASHBOARD_REPOSITORY, useExisting: SupabaseDashboardRepository },
    { provide: OUTBOX_SYNC_PORT, useExisting: OutboxSyncService },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
