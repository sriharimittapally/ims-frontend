import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  InventorySummaryReport, LowStockAlertReport, PurchaseOrderReport,
  SupplierPerformanceReport, StockTrendReport, TopProductsReport,
  WarehouseStockReport, StaffActivityReport, MyIssueHistoryReport, SupplierPOReport
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  // Admin
  adminInventorySummary(): Observable<ApiResponse<InventorySummaryReport>> {
    return this.http.get<ApiResponse<InventorySummaryReport>>(`${this.base}/admin/inventory-summary`);
  }

  adminLowStockAlerts(): Observable<ApiResponse<LowStockAlertReport>> {
    return this.http.get<ApiResponse<LowStockAlertReport>>(`${this.base}/admin/low-stock-alerts`);
  }

  adminPOReport(): Observable<ApiResponse<PurchaseOrderReport>> {
    return this.http.get<ApiResponse<PurchaseOrderReport>>(`${this.base}/admin/purchase-orders`);
  }

  adminSupplierPerformance(): Observable<ApiResponse<SupplierPerformanceReport>> {
    return this.http.get<ApiResponse<SupplierPerformanceReport>>(`${this.base}/admin/supplier-performance`);
  }

  adminStockTrend(from: string, to: string): Observable<ApiResponse<StockTrendReport>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ApiResponse<StockTrendReport>>(`${this.base}/admin/stock-trend`, { params });
  }

  adminTopProducts(): Observable<ApiResponse<TopProductsReport>> {
    return this.http.get<ApiResponse<TopProductsReport>>(`${this.base}/admin/top-products`);
  }

  adminWarehouseReport(warehouseId: number): Observable<ApiResponse<WarehouseStockReport>> {
    return this.http.get<ApiResponse<WarehouseStockReport>>(`${this.base}/admin/warehouse/${warehouseId}`);
  }

  // Manager
  managerWarehouseStock(): Observable<ApiResponse<WarehouseStockReport>> {
    return this.http.get<ApiResponse<WarehouseStockReport>>(`${this.base}/manager/warehouse-stock`);
  }

  managerLowStockAlerts(): Observable<ApiResponse<LowStockAlertReport>> {
    return this.http.get<ApiResponse<LowStockAlertReport>>(`${this.base}/manager/low-stock-alerts`);
  }

  managerStockTrend(from: string, to: string): Observable<ApiResponse<StockTrendReport>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ApiResponse<StockTrendReport>>(`${this.base}/manager/stock-trend`, { params });
  }

  managerPOReport(): Observable<ApiResponse<PurchaseOrderReport>> {
    return this.http.get<ApiResponse<PurchaseOrderReport>>(`${this.base}/manager/purchase-orders`);
  }

  managerStaffActivity(): Observable<ApiResponse<StaffActivityReport>> {
    return this.http.get<ApiResponse<StaffActivityReport>>(`${this.base}/manager/staff-activity`);
  }

  managerTopProducts(): Observable<ApiResponse<TopProductsReport>> {
    return this.http.get<ApiResponse<TopProductsReport>>(`${this.base}/manager/top-products`);
  }

  // Staff
  staffIssueHistory(): Observable<ApiResponse<MyIssueHistoryReport>> {
    return this.http.get<ApiResponse<MyIssueHistoryReport>>(`${this.base}/staff/my-issue-history`);
  }

  staffWarehouseTrend(from: string, to: string): Observable<ApiResponse<StockTrendReport>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ApiResponse<StockTrendReport>>(`${this.base}/staff/warehouse-trend`, { params });
  }

  // Supplier
  supplierPOReport(): Observable<ApiResponse<SupplierPOReport>> {
    return this.http.get<ApiResponse<SupplierPOReport>>(`${this.base}/supplier/po-history`);
  }
}