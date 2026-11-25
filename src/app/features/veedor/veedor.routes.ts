import type { Routes } from '@angular/router';

export const VEEDOR_ROUTES: Routes = [
  {
    path: 'acta/:jrvId/:dignidad',
    loadComponent: () => import('./pages/acta-form/acta-form.page').then((m) => m.ActaFormPage),
  },
  {
    path: '',
    loadComponent: () => import('./pages/veedor-tabs/veedor-tabs.page').then((m) => m.VeedorTabsPage),
    children: [
      {
        path: 'mesas',
        loadComponent: () => import('./pages/mis-mesas/mis-mesas.page').then((m) => m.MisMesasPage),
      },
      {
        path: 'pendientes',
        loadComponent: () =>
          import('./pages/pendientes-offline/pendientes-offline.page').then((m) => m.PendientesOfflinePage),
      },
      {
        path: '',
        redirectTo: 'mesas',
        pathMatch: 'full',
      },
    ],
  },
];
