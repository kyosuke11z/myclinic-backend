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
      },
      {
        path: 'triage',
        loadComponent: () => import('./pages/triage/triage').then(m => m.TriagePage)
      },
      {
        path: 'consultation',
        loadComponent: () => import('./pages/consultation/consultation').then(m => m.ConsultationPage)
      },
      {
        path: 'dispensing',
        loadComponent: () => import('./pages/dispensing/dispensing').then(m => m.DispensingPage)
      },
      {
        path: 'cashier',
        loadComponent: () => import('./pages/cashier/cashier').then(m => m.CashierPage)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./pages/audit-logs/audit-logs').then(m => m.AuditLogsPage)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
