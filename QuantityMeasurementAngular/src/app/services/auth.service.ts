import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/quantity.models';
 
@Injectable({ providedIn: 'root' })
export class AuthService {
 
  private readonly TOKEN_KEY = 'qma_token';
  private readonly EMAIL_KEY = 'qma_email';
 
  // BehaviorSubject — holds current logged-in state, components subscribe to changes
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
 
  constructor(private http: HttpClient) {}
 
  // Observable that components can subscribe to for live auth state
  get isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  get isLoggedIn(): boolean {
    return this.hasToken();
  }
 
  get token(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
 
  get email(): string | null {
    return sessionStorage.getItem(this.EMAIL_KEY);
  }
 
  register(data: RegisterRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/api/auth/register`, data
    );
  }
 
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/api/auth/login`, data
    ).pipe(
      // tap — side effect: store token when login succeeds
      tap(res => {
        sessionStorage.setItem(this.TOKEN_KEY, res.token);
        sessionStorage.setItem(this.EMAIL_KEY, res.email);
        this.loggedIn$.next(true);   // notify all subscribers
      })
    );
  }
 
  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.EMAIL_KEY);
    this.loggedIn$.next(false);
  }
 
  private hasToken(): boolean {
    return !!sessionStorage.getItem(this.TOKEN_KEY);
  }
}
