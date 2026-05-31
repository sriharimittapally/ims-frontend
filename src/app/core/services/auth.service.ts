import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthRequest, AuthResponse, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'ims_token';
  private readonly USER_KEY = 'ims_user';
  private logoutTimer?: ReturnType<typeof setTimeout>;

  currentUser = signal<AuthResponse | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {
    this.scheduleAutoLogout();
  }

  login(request: AuthRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.data.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
        this.currentUser.set(res.data);
        this.scheduleAutoLogout();
      })
    );
  }

  registerSupplier(request: RegisterRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${environment.apiUrl}/suppliers/register`, request);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/']);
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = undefined;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getRole(): string | null {
    return this.currentUser()?.role ?? null;
  }

  hasRole(role: string): boolean {
    return this.getRole() === role;
  }

  isTokenExpired(token = this.getToken()): boolean {
    const expiry = this.getTokenExpiry(token);
    return !expiry || Date.now() >= expiry;
  }

handleExpiredSession(): void {
  if (this.getToken() && this.isTokenExpired()) {
    setTimeout(() => this.logout(), 0);
  }
}
  private getTokenExpiry(token: string | null): number | null {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private scheduleAutoLogout(): void {
    if (this.logoutTimer) clearTimeout(this.logoutTimer);

    const expiry = this.getTokenExpiry(this.getToken());
    if (!expiry) return;

    const timeout = expiry - Date.now();

    if (timeout <= 0) {
      setTimeout(() => this.logout(), 0);
      return;
    }

    this.logoutTimer = setTimeout(() => this.logout(), timeout);
  }

  private loadUser(): AuthResponse | null {
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (!token || this.isTokenExpired(token)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      return null;
    }

    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  redirectByRole(): void {
    const role = this.getRole();

    switch (role) {
      case 'ADMIN': this.router.navigate(['/admin/dashboard']); break;
      case 'MANAGER': this.router.navigate(['/manager/dashboard']); break;
      case 'STAFF': this.router.navigate(['/staff/dashboard']); break;
      case 'SUPPLIER': this.router.navigate(['/supplier/dashboard']); break;
      default: this.router.navigate(['/']);
    }
  }
}