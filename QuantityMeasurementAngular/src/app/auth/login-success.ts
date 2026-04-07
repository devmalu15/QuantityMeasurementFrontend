import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-login-success',
  standalone: true,
  template: `
    <div class="min-h-[90vh] flex items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-slate-600 font-medium">Completing login...</p>
      </div>
    </div>
  `
})
export class LoginSuccess implements OnInit {
  private router     = inject(Router);
  private authService = inject(AuthService);
  private platformId  = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const params = new URLSearchParams(window.location.search);
      const token  = params.get('token');

      if (token) {
        this.authService.loginWithToken(token);
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/auth']);
      }
    }
  }
}