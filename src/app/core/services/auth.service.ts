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
  private readonly USER_KEY  = 'ims_user';

  currentUser = signal<AuthResponse | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(request: AuthRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.data.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
        this.currentUser.set(res.data);
      })
    );
  }

  registerSupplier(request: RegisterRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${environment.apiUrl}/suppliers/register`, request);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string | null {
    return this.currentUser()?.role ?? null;
  }

  hasRole(role: string): boolean {
    return this.getRole() === role;
  }

  private loadUser(): AuthResponse | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  redirectByRole(): void {
    const role = this.getRole();
    switch (role) {
      case 'ADMIN':    this.router.navigate(['/admin/dashboard']);    break;
      case 'MANAGER':  this.router.navigate(['/manager/dashboard']);  break;
      case 'STAFF':    this.router.navigate(['/staff/dashboard']);    break;
      case 'SUPPLIER': this.router.navigate(['/supplier/dashboard']); break;
      default:              this.router.navigate(['/auth/login']);
    }
  }
}