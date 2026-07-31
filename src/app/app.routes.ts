import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/automobile/components/car-table/car-table').then((m) => m.CarTable),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./features/automobile/components/car-form/car-form').then((m) => m.CarForm),
  },
];
