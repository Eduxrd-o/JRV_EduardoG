import type { Routes } from '@angular/router';

export const PROVINCIAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/provincial-tabs/provincial-tabs.page').then((m) => m.ProvincialTabsPage),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'recintos',
        loadComponent: () => import('./pages/recintos/recintos.page').then((m) => m.RecintosPage),
      },
      {
        path: 'coordinadores',
        loadComponent: () => import('./pages/coordinadores/coordinadores.page').then((m) => m.CoordinadoresPage),
      },
      {
        path: 'gps',
        loadComponent: () => import('./pages/mapa-gps/mapa-gps.page').then((m) => m.MapaGpsPage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
