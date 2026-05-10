import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { UserResponse, CreateUserRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ADMIN
  getAllUsers(): Observable<ApiResponse<UserResponse[]>> {
    return this.http.get<ApiResponse<UserResponse[]>>(`${this.base}/admin/users`);
  }

  getUsersByRole(role: string): Observable<ApiResponse<UserResponse[]>> {
    return this.http.get<ApiResponse<UserResponse[]>>(`${this.base}/admin/users/role/${role}`);
  }

  createManager(request: CreateUserRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.base}/admin/users/manager`, request);
  }

  createStaffByAdmin(request: CreateUserRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.base}/admin/users/staff`, request);
  }

  activateUser(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/admin/users/${id}/activate`, {});
  }

  deactivateUser(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/admin/users/${id}/deactivate`, {});
  }

  assignManagerToWarehouse(warehouseId: number, managerId: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/admin/warehouses/${warehouseId}/assign-manager/${managerId}`, {});
  }

  // MANAGER
  getMyStaff(): Observable<ApiResponse<UserResponse[]>> {
    return this.http.get<ApiResponse<UserResponse[]>>(`${this.base}/manager/staff`);
  }

  createStaffByManager(request: CreateUserRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.base}/manager/staff`, request);
  }

  activateStaff(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/manager/staff/${id}/activate`, {});
  }

  deactivateStaff(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/manager/staff/${id}/deactivate`, {});
  }
}