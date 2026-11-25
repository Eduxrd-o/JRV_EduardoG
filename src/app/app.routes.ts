import type { Routes } from '@angular/router';

import { rolGuard } from './core/auth/auth.guards';

/**
 * ADR-005: Rutas perezosas por funcionalidad protegidas con guardas funcionales por rol.
 */
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'provincial',
    canActivate: [rolGuard(['provincial'])],
    loadChildren: () => import('./features/provincial/provincial.routes').then((m) => m.PROVINCIAL_ROUTES),
  },
  {
    path: 'recinto',
    canActivate: [rolGuard(['recinto'])],
    loadChildren: () => import('./features/recinto/recinto.routes').then((m) => m.RECINTO_ROUTES),
  },
  {
    path: 'veedor',
    canActivate: [rolGuard(['veedor'])],
    loadChildren: () => import('./features/veedor/veedor.routes').then((m) => m.VEEDOR_ROUTES),
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
