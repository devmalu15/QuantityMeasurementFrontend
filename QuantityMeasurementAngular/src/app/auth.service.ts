import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from './models';
 
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'qma_token';
  private readonly EMAIL_KEY = 'qma_email';
  private readonly GUEST_KEY = 'qma_guest';
  private readonly API_URL = 'https://qma-gateway.runasp.net';
 
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  private guest$ = new BehaviorSubject<boolean>(this.isGuestToken());
 
  get isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  get isGuest$(): Observable<boolean> {
    return this.guest$.asObservable();
  }

  get isLoggedIn(): boolean {
    return this.hasToken();
  }

  get isGuest(): boolean {
    return this.isGuestToken();
  }

  startGuest(): void {
    if (this.isBrowser) {
      sessionStorage.setItem(this.GUEST_KEY, 'true');
    }
    this.guest$.next(true);
  }

  clearGuest(): void {
    if (this.isBrowser) {
      sessionStorage.removeItem(this.GUEST_KEY);
    }
    this.guest$.next(false);
  }

  private isGuestToken(): boolean {
    if (!this.isBrowser) return false;
    return !!sessionStorage.getItem(this.GUEST_KEY);
  }
 
  get token(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
 
  get email(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(this.EMAIL_KEY);
  }
 
  register(data: RegisterRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/api/auth/register`, data
    );
  }
 
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.API_URL}/api/auth/login`, data
    ).pipe(
      tap(res => {
        if (this.isBrowser) {
          sessionStorage.setItem(this.TOKEN_KEY, res.token);
          sessionStorage.setItem(this.EMAIL_KEY, res.email);
        }
        this.loggedIn$.next(true);
        this.clearGuest();
      })
    );
  }
 
  logout(): void {
    if (this.isBrowser) {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.EMAIL_KEY);
    }
    this.loggedIn$.next(false);
    this.clearGuest();
  }
 
  loginWithGoogle(): void {
    if (this.isBrowser) {
      window.location.href = `${this.API_URL}/api/auth/google-login`;
    }
  }

  loginWithToken(token: string): void {
    if (this.isBrowser) {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        if (email) {
          sessionStorage.setItem(this.EMAIL_KEY, email);
        }
      } catch (e) {
        console.error('Error parsing token', e);
      }
    }
    this.loggedIn$.next(true);
    this.clearGuest();
  }

  private hasToken(): boolean {
    if (!this.isBrowser) return false;
    return !!sessionStorage.getItem(this.TOKEN_KEY);
  }
}
