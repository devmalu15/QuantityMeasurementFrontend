import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="min-h-[90vh] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <!-- Background Elements -->
      <div class="absolute top-1/4 -left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div class="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl -z-10 animate-pulse" style="animation-delay: 1.5s"></div>

      <div class="w-full max-w-md space-y-8 card animate-fade-in border border-white/50 shadow-2xl relative z-10">
        <div class="text-center space-y-2">
          <div class="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-2">
            <mat-icon class="!text-3xl !w-8 !h-8">lock_open</mat-icon>
          </div>
          <h2 class="text-3xl font-extrabold text-slate-900">
            {{ isLogin() ? 'Welcome Back' : 'Create Account' }}
          </h2>
          <p class="text-slate-500">
            {{ isLogin() ? 'Enter your credentials to access your history' : 'Join us to start tracking your measurements' }}
          </p>
        </div>

        <div class="flex p-1 bg-slate-100 rounded-2xl mb-8">
          <button (click)="isLogin.set(true)" 
                  class="flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                  [class.bg-white]="isLogin()"
                  [class.shadow-sm]="isLogin()"
                  [class.text-blue-600]="isLogin()"
                  [class.text-slate-500]="!isLogin()">
            Login
          </button>
          <button (click)="isLogin.set(false)" 
                  class="flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                  [class.bg-white]="!isLogin()"
                  [class.shadow-sm]="!isLogin()"
                  [class.text-blue-600]="!isLogin()"
                  [class.text-slate-500]="isLogin()">
            Register
          </button>
        </div>

        <form #authForm="ngForm" (ngSubmit)="onSubmit(authForm)" class="space-y-6">
          <div class="space-y-4">
            <div class="space-y-1">
              <label for="email" class="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
              <div class="relative">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 !text-xl">mail_outline</mat-icon>
                <input id="email" type="email" name="email" [(ngModel)]="email" required email
                       class="input-field pl-12" placeholder="name@example.com">
              </div>
            </div>

            <div class="space-y-1">
              <label for="password" class="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
              <div class="relative">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 !text-xl">lock_outline</mat-icon>
                <input id="password" [type]="showPassword() ? 'text' : 'password'" name="password" [(ngModel)]="password" required minlength="6"
                       class="input-field pl-12 pr-12" placeholder="••••••••">
                <button type="button" (click)="showPassword.set(!showPassword())" 
                        class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  <mat-icon class="!text-xl">{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>
          </div>

          @if (errorMsg()) {
            <div class="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium animate-fade-in">
              {{ errorMsg() }}
            </div>
          }

          @if (successMsg()) {
            <div class="p-4 rounded-2xl bg-emerald-50 text-emerald-600 text-sm font-medium animate-fade-in">
              {{ successMsg() }}
            </div>
          }

          <button type="submit" [disabled]="isLoading() || authForm.invalid" 
                  class="btn btn-primary w-full py-4 text-lg">
            @if (!isLoading()) {
              <span>{{ isLogin() ? 'Sign In' : 'Sign Up' }}</span>
            } @else {
              <span class="flex items-center gap-2">
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
            }
          </button>
        </form>

        <div class="relative py-4">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-sm font-bold">
            <span class="px-2 bg-white text-slate-500">Or continue with</span>
          </div>
        </div>

        <button type="button" (click)="loginWithGoogle()" 
                class="w-full py-4 text-lg font-semibold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 text-slate-700 bg-white">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            <path fill="none" d="M1 1h22v22H1z"/>
          </svg>
          Google
        </button>

        <div class="text-center mt-6">
          <button (click)="goBack()" class="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
            <mat-icon class="!text-sm !w-4 !h-4 align-middle mr-1">arrow_back</mat-icon>
            Back to Landing
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Auth {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLogin = signal(true);
  isLoading = signal(false);
  showPassword = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  email = '';
  password = '';

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  onSubmit(form: NgForm) {
    if (form.invalid) return;

    this.isLoading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const data = { email: this.email, password: this.password };

    if (this.isLogin()) {
      this.authService.login(data).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMsg.set(err.error || 'Invalid email or password');
        }
      });
    } else {
      this.authService.register(data).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.successMsg.set(res.message);
          setTimeout(() => {
            this.isLogin.set(true);
            this.successMsg.set('');
          }, 2000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMsg.set(err.error || 'Registration failed');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/landing']);
  }
}
