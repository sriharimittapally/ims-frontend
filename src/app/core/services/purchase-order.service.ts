import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PurchaseOrderResponse, PurchaseOrderRequest, PurchaseOrderRejectionRequest } from '../models/purchase-order.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private base = `${environment.apiUrl}/purchase-orders`;

  constructor(private http: HttpClient) {}

  // Admin
  getAll(): Observable<ApiResponse<PurchaseOrderResponse[]>> {
    return this.http.get<ApiResponse<PurchaseOrderResponse[]>>(this.base);
  }

  getByStatus(status: string): Observable<ApiResponse<PurchaseOrderResponse[]>> {
    return this.http.get<ApiResponse<PurchaseOrderResponse[]>>(`${this.base}/status/${status}`);
  }

  // Manager
  create(request: PurchaseOrderRequest): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.post<ApiResponse<PurchaseOrderResponse>>(this.base, request);
  }

  send(id: number): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.put<ApiResponse<PurchaseOrderResponse>>(`${this.base}/${id}/send`, {});
  }

  cancel(id: number): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.put<ApiResponse<PurchaseOrderResponse>>(`${this.base}/${id}/cancel`, {});
  }

  getMyWarehousePOs(): Observable<ApiResponse<PurchaseOrderResponse[]>> {
    return this.http.get<ApiResponse<PurchaseOrderResponse[]>>(`${this.base}/my-warehouse`);
  }

  // Staff
  receive(id: number): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.put<ApiResponse<PurchaseOrderResponse>>(`${this.base}/${id}/receive`, {});
  }

  // Supplier
  getMyPOs(): Observable<ApiResponse<PurchaseOrderResponse[]>> {
    return this.http.get<ApiResponse<PurchaseOrderResponse[]>>(`${this.base}/supplier/my-pos`);
  }

  getMyPOsByStatus(status: string): Observable<ApiResponse<PurchaseOrderResponse[]>> {
    return this.http.get<ApiResponse<PurchaseOrderResponse[]>>(`${this.base}/supplier/status/${status}`);
  }

  acceptPO(id: number): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.put<ApiResponse<PurchaseOrderResponse>>(`${this.base}/${id}/accept`, {});
  }

  rejectPO(id: number, request: PurchaseOrderRejectionRequest): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.put<ApiResponse<PurchaseOrderResponse>>(`${this.base}/${id}/reject`, request);
  }

  shipPO(id: number): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.put<ApiResponse<PurchaseOrderResponse>>(`${this.base}/${id}/ship`, {});
  }

  getById(id: number): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.get<ApiResponse<PurchaseOrderResponse>>(`${this.base}/${id}`);
  }
}