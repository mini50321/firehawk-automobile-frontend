import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/automobile/components/car-table/car-table').then((m) => m.CarTable),
  },
];
