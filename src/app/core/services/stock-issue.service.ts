import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { StockIssueResponse } from '../models/stock-issue.model';

@Injectable({ providedIn: 'root' })
export class StockIssueService {
  private base = `${environment.apiUrl}/stock-issues`;

  constructor(private http: HttpClient) {}

  // Staff
  create(note?: string): Observable<ApiResponse<StockIssueResponse>> {
    let params = new HttpParams();
    if (note) params = params.set('note', note);
    return this.http.post<ApiResponse<StockIssueResponse>>(this.base, {}, { params });
  }

  addItem(issueId: number, productId: number, quantity: number): Observable<ApiResponse<StockIssueResponse>> {
    const params = new HttpParams().set('productId', productId).set('quantity', quantity);
    return this.http.post<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/items`, {}, { params });
  }

  removeItem(issueId: number, itemId: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.delete<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/items/${itemId}`);
  }

  cancel(issueId: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.put<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/cancel`, {});
  }

  issueStock(issueId: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.put<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/issue`, {});
  }

  getMyIssues(): Observable<ApiResponse<StockIssueResponse[]>> {
    return this.http.get<ApiResponse<StockIssueResponse[]>>(`${this.base}/my-issues`);
  }

  // Manager
  approve(issueId: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.put<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/approve`, {});
  }

  reject(issueId: number, reason: string): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.put<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/reject`, { reason });
  }

  getPendingForWarehouse(): Observable<ApiResponse<StockIssueResponse[]>> {
    return this.http.get<ApiResponse<StockIssueResponse[]>>(`${this.base}/warehouse/pending`);
  }

  getAllForWarehouse(): Observable<ApiResponse<StockIssueResponse[]>> {
    return this.http.get<ApiResponse<StockIssueResponse[]>>(`${this.base}/warehouse/all`);
  }

  getById(id: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.get<ApiResponse<StockIssueResponse>>(`${this.base}/${id}`);
  }

  getStaffDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/dashboard`);
  }
}