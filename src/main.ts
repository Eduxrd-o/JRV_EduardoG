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
import { ACTA_REPOSITORY, JRV_REPOSITORY, PHOTO_STORAGE_REPOSITORY } from './app/core/di/repository.tokens';
import { GlobalErrorHandler } from './app/core/errors/global-error.handler';
import { SupabasePhotoStorageRepository } from './app/data/storage/supabase-photo-storage.repository';
import { SupabaseActaRepository } from './app/data/supabase/supabase-acta.repository';
import { SupabaseJrvRepository } from './app/data/supabase/supabase-jrv.repository';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: JRV_REPOSITORY, useExisting: SupabaseJrvRepository },
    { provide: ACTA_REPOSITORY, useExisting: SupabaseActaRepository },
    { provide: PHOTO_STORAGE_REPOSITORY, useExisting: SupabasePhotoStorageRepository },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
