import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginPage)
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage)
      },
      {
        path: 'patients',
        loadComponent: () => import('./pages/patients/patients').then(m => m.PatientsPage)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./pages/appointments/appointments').then(m => m.AppointmentsPage)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
