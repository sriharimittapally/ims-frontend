import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { WarehouseResponse, WarehouseRequest } from '../models/warehouse.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private base = `${environment.apiUrl}/warehouses`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<WarehouseResponse[]>> {
    return this.http.get<ApiResponse<WarehouseResponse[]>>(this.base);
  }

  getById(id: number): Observable<ApiResponse<WarehouseResponse>> {
    return this.http.get<ApiResponse<WarehouseResponse>>(`${this.base}/${id}`);
  }

  create(request: WarehouseRequest): Observable<ApiResponse<WarehouseResponse>> {
    return this.http.post<ApiResponse<WarehouseResponse>>(this.base, request);
  }

  update(id: number, request: WarehouseRequest): Observable<ApiResponse<WarehouseResponse>> {
    return this.http.put<ApiResponse<WarehouseResponse>>(`${this.base}/${id}`, request);
  }

  activate(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/${id}/activate`, {});
  }

  deactivate(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/${id}/deactivate`, {});
  }
}