import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AdminDashboardResponse, ManagerDashboardResponse,
  StaffDashboardResponse, SupplierDashboardResponse
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAdminDashboard(): Observable<ApiResponse<AdminDashboardResponse>> {
    return this.http.get<ApiResponse<AdminDashboardResponse>>(`${this.base}/admin/dashboard`);
  }

  getManagerDashboard(): Observable<ApiResponse<ManagerDashboardResponse>> {
    return this.http.get<ApiResponse<ManagerDashboardResponse>>(`${this.base}/manager/dashboard`);
  }

  getStaffDashboard():Observable<ApiResponse<StaffDashboardResponse>>{
    return this.http.get<ApiResponse<StaffDashboardResponse>>(`${this.base}/stock-issues/dashboard`);
  }

  getSupplierDashboard(): Observable<ApiResponse<SupplierDashboardResponse>> {
    return this.http.get<ApiResponse<SupplierDashboardResponse>>(`${this.base}/suppliers/dashboard`);
  }
}