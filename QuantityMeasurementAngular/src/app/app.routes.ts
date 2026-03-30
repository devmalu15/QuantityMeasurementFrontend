 
import { Routes } from '@angular/router';
import { authGuard }  from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
 
export const routes: Routes = [
  { path: '',        redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth',      loadComponent: () => import('./components/auth/auth.component')
                         .then(m => m.AuthComponent),
                       canActivate: [guestGuard] },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component')
                         .then(m => m.DashboardComponent),
                       canActivate: [authGuard] },
  { path: '**',      redirectTo: 'auth' }
];
