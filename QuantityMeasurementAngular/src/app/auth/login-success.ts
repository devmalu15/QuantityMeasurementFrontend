import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.loginWithToken(token);
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/auth']);
      }
    });
  }
}
