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

        <div class="text-center">
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
