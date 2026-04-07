import { ChangeDetectionStrategy, Component, inject, AfterViewInit, ElementRef, viewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      <!-- Background Elements -->
      <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>

      <div #hero class="max-w-3xl space-y-8">
        <div class="hero-icon inline-flex p-4 rounded-3xl liquid-glass mb-4">
          <mat-icon class="text-blue-600 !text-4xl !w-10 !h-10">straighten</mat-icon>
        </div>
        
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
          Precision in every <span class="text-blue-600">Measurement</span>
        </h1>
        
        <p class="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A minimalist, professional tool for converting and calculating quantities across length, weight, volume, and temperature.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <button (click)="goLogin()" class="btn btn-primary w-full sm:w-auto text-lg px-8 py-4">
            Get Started
            <mat-icon>arrow_forward</mat-icon>
          </button>
          <button (click)="continueGuest()" class="btn btn-glass w-full sm:w-auto text-lg px-8 py-4">
            Continue as Guest
            <mat-icon>person_outline</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .hero-icon {
      animation: float 6s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Landing implements AfterViewInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private heroEl = viewChild<ElementRef>('hero');
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (typeof window === 'undefined') {
      return;
    }

    const hero = this.heroEl();
    if (!hero) {
      return;
    }

    setTimeout(() => {
      import('motion').then(({ animate, stagger }) => {
        const children = hero.nativeElement.children;
        if (children) {
          animate(
            Array.from(children),
            { opacity: [0, 1], y: [20, 0] },
            { delay: stagger(0.1), duration: 0.8, ease: [0.22, 1, 0.36, 1] }
          );
        }
      });
    });
  }

  goLogin() {
    this.router.navigate(['/auth']);
  }

  continueGuest() {
    this.auth.startGuest();
    this.router.navigate(['/dashboard']);
  }
}
