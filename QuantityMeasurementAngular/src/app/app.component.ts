 
import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
 
@Component({
  selector:    'app-root',
  standalone:  true,
  imports:     [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl:    './app.component.scss'
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {}
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
