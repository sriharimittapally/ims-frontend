import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { InventoryResponse } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private base = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<InventoryResponse[]>> {
    return this.http.get<ApiResponse<InventoryResponse[]>>(this.base);
  }

  getByWarehouse(warehouseId: number): Observable<ApiResponse<InventoryResponse[]>> {
    return this.http.get<ApiResponse<InventoryResponse[]>>(`${this.base}/warehouse/${warehouseId}`);
  }

  getLowStock(): Observable<ApiResponse<InventoryResponse[]>> {
    return this.http.get<ApiResponse<InventoryResponse[]>>(`${this.base}/low-stock`);
  }

  getMyWarehouse(): Observable<ApiResponse<InventoryResponse[]>> {
    return this.http.get<ApiResponse<InventoryResponse[]>>(`${this.base}/my-warehouse`);
  }
}