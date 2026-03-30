import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
 
@Component({
  selector:    'app-auth',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl:    './auth.component.scss'
})
export class AuthComponent {
  // State
  activeTab: 'login' | 'register' = 'login';
  isLoading = false;
  errorMsg  = '';
  successMsg = '';
 
  // Form models
  loginData    = { email: '', password: '' };
  registerData = { email: '', password: '' };
 
  constructor(private auth: AuthService, private router: Router) {}
 
  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.errorMsg  = '';
    this.successMsg = '';
  }
 
  onLogin(form: NgForm): void {
    if (form.invalid) { form.form.markAllAsTouched(); return; }
 
    this.isLoading = true;
    this.errorMsg  = '';
 
    this.auth.login(this.loginData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg  = err.error ?? 'Invalid email or password';
      }
    });
  }
 
  onRegister(form: NgForm): void {
    if (form.invalid) { form.form.markAllAsTouched(); return; }
 
    // Edge case: password strength validation
    if (this.registerData.password.length < 6) {
      this.errorMsg = 'Password must be at least 6 characters'; return;
    }
 
    this.isLoading  = true;
    this.errorMsg   = '';
    this.successMsg = '';
 
    this.auth.register(this.registerData).subscribe({
      next: (res) => {
        this.isLoading  = false;
        this.successMsg = res.message;
        setTimeout(() => this.switchTab('login'), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg  = err.error ?? 'Registration failed';
      }
    });
  }
}
