import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  constructor(private auth: AuthService, private router: Router) {}

  goLogin(): void {
    this.router.navigate(['/auth'], { queryParams: { tab: 'login' } });
  }

  goRegister(): void {
    this.router.navigate(['/auth'], { queryParams: { tab: 'register' } });
  }

  continueGuest(): void {
    this.auth.startGuest();
    this.router.navigate(['/dashboard']);
  }
}
