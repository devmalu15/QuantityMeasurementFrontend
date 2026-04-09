import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { 
    path: 'landing', 
    loadComponent: () => import('./landing/landing').then(m => m.Landing) 
  },
  { 
    path: 'auth', 
    loadComponent: () => import('./dashboard/auth/auth').then(m => m.Auth) 
  },
  { 
    path: 'login-success', 
    loadComponent: () => import('./dashboard/auth/login-success').then(m => m.LoginSuccess) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard) 
  },
  { path: '**', redirectTo: 'landing' }
];
