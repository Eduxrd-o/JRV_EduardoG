import type { Routes } from '@angular/router';

import { authGuard, noAuthGuard } from '../../core/auth/auth.guards';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'recuperar',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./pages/recuperar/recuperar.page').then((m) => m.RecuperarPage),
  },
  {
    path: 'cambiar-clave',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cambiar-clave/cambiar-clave.page').then((m) => m.CambiarClavePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
