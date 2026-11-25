import type { Routes } from '@angular/router';

export const RECINTO_ROUTES: Routes = [
  {
    path: 'acta/:jrvId/:dignidad',
    loadComponent: () => import('../veedor/pages/acta-form/acta-form.page').then((m) => m.ActaFormPage),
  },
  {
    path: '',
    loadComponent: () => import('./pages/recinto-tabs/recinto-tabs.page').then((m) => m.RecintoTabsPage),
    children: [
      {
        path: 'mesas',
        loadComponent: () => import('./pages/recinto-mesas/recinto-mesas.page').then((m) => m.RecintoMesasPage),
      },
      {
        path: 'veedores',
        loadComponent: () =>
          import('./pages/recinto-veedores/recinto-veedores.page').then((m) => m.RecintoVeedoresPage),
      },
      {
        path: 'actas',
        loadComponent: () => import('./pages/recinto-actas/recinto-actas.page').then((m) => m.RecintoActasPage),
      },
      {
        path: '',
        redirectTo: 'mesas',
        pathMatch: 'full',
      },
    ],
  },
];
