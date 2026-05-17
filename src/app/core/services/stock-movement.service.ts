import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { StockMovementResponse } from '../models/stock-movement.model';

@Injectable({ providedIn: 'root' })
export class StockMovementService {
  private base = `${environment.apiUrl}/stock-movements`;

  constructor(private http: HttpClient) {}

  // ── ADMIN — global audit trail ────────────────────────────────────────────

  /** All movements across all warehouses — ADMIN only */
  getAllMovements(): Observable<ApiResponse<StockMovementResponse[]>> {
    return this.http.get<ApiResponse<StockMovementResponse[]>>(this.base);
  }

  /** All movements for a product globally — ADMIN only */
  getByProductGlobal(productId: number): Observable<ApiResponse<StockMovementResponse[]>> {
    return this.http.get<ApiResponse<StockMovementResponse[]>>(
      `${this.base}/product/${productId}`
    );
  }

  /** All movements for a warehouse — ADMIN only */
  getByWarehouseGlobal(warehouseId: number): Observable<ApiResponse<StockMovementResponse[]>> {
    return this.http.get<ApiResponse<StockMovementResponse[]>>(
      `${this.base}/warehouse/${warehouseId}`
    );
  }

  /** Product movements within a specific warehouse — ADMIN only */
  getByProductAndWarehouse(
    warehouseId: number,
    productId: number
  ): Observable<ApiResponse<StockMovementResponse[]>> {
    return this.http.get<ApiResponse<StockMovementResponse[]>>(
      `${this.base}/warehouse/${warehouseId}/product/${productId}`
    );
  }

  /** Audit trail for a PO or StockIssue — ADMIN only */
  getByReference(
    referenceType: 'PURCHASE_ORDER' | 'STOCK_ISSUE',
    referenceId: number
  ): Observable<ApiResponse<StockMovementResponse[]>> {
    return this.http.get<ApiResponse<StockMovementResponse[]>>(
      `${this.base}/reference/${referenceType}/${referenceId}`
    );
  }

  // ── MANAGER — own warehouse only ──────────────────────────────────────────

  /** All movements in manager's warehouse */
  getMyWarehouseMovements(): Observable<ApiResponse<StockMovementResponse[]>> {
    return this.http.get<ApiResponse<StockMovementResponse[]>>(
      `${this.base}/my-warehouse`
    );
  }

  /** Product movements within manager's warehouse */
  getMyWarehouseProductMovements(
    productId: number
  ): Observable<ApiResponse<StockMovementResponse[]>> {
    return this.http.get<ApiResponse<StockMovementResponse[]>>(
      `${this.base}/my-warehouse/product/${productId}`
    );
  }
}