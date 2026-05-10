import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SupplierProfileResponse, SupplierProfileRequest, ApprovalRequest } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private base = `${environment.apiUrl}/suppliers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<SupplierProfileResponse[]>> {
    return this.http.get<ApiResponse<SupplierProfileResponse[]>>(this.base);
  }

  getPending(): Observable<ApiResponse<SupplierProfileResponse[]>> {
    return this.http.get<ApiResponse<SupplierProfileResponse[]>>(`${this.base}/pending`);
  }

  getById(id: number): Observable<ApiResponse<SupplierProfileResponse>> {
    return this.http.get<ApiResponse<SupplierProfileResponse>>(`${this.base}/${id}`);
  }

  approve(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/${id}/approve`, {});
  }

  reject(id: number, request: ApprovalRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/${id}/reject`, request);
  }

  // Supplier self
  getMyProfile(): Observable<ApiResponse<SupplierProfileResponse>> {
    return this.http.get<ApiResponse<SupplierProfileResponse>>(`${this.base}/profile`);
  }

  completeProfile(request: SupplierProfileRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.base}/profile`, request);
  }
}