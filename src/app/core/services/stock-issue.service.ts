import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { StockIssueResponse, StockIssueRejectRequest } from '../models/stock-issue.model';
import { StaffDashboardResponse } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class StockIssueService {
  private base = `${environment.apiUrl}/stock-issues`;

  constructor(private http: HttpClient) {}

  // ── STAFF ──────────────────────────────────────────────────────────────────

  getStaffDashboard(): Observable<ApiResponse<StaffDashboardResponse>> {
    return this.http.get<ApiResponse<StaffDashboardResponse>>(`${this.base}/dashboard`);
  }

  /** Creates an empty issue header in DRAFT status */
  create(note?: string): Observable<ApiResponse<StockIssueResponse>> {
    let params = new HttpParams();
    if (note?.trim()) params = params.set('note', note.trim());
    return this.http.post<ApiResponse<StockIssueResponse>>(this.base, {}, { params });
  }

  /** Adds a product to a DRAFT issue */
  addItem(issueId: number, productId: number, quantity: number): Observable<ApiResponse<StockIssueResponse>> {
    const params = new HttpParams()
      .set('productId', productId.toString())
      .set('quantity', quantity.toString());
    return this.http.post<ApiResponse<StockIssueResponse>>(
      `${this.base}/${issueId}/items`, {}, { params }
    );
  }

  /** Removes a product line from a DRAFT issue */
  removeItem(issueId: number, itemId: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.delete<ApiResponse<StockIssueResponse>>(
      `${this.base}/${issueId}/items/${itemId}`
    );
  }

  /** Staff cancels a DRAFT or PENDING issue */
  cancel(issueId: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.put<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/cancel`, {});
  }

  /** Staff submits a DRAFT issue for manager review → moves to PENDING */
  submitForReview(issueId: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.put<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/submit`, {});
  }

  /** Staff executes stock out on an APPROVED issue → moves to ISSUED */
  issueStock(issueId: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.put<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/issue`, {});
  }

  /** All issues created by this staff member */
  getMyIssues(): Observable<ApiResponse<StockIssueResponse[]>> {
    return this.http.get<ApiResponse<StockIssueResponse[]>>(`${this.base}/my-issues`);
  }

  getById(id: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.get<ApiResponse<StockIssueResponse>>(`${this.base}/${id}`);
  }

  // ── MANAGER ───────────────────────────────────────────────────────────────

  approve(issueId: number): Observable<ApiResponse<StockIssueResponse>> {
    return this.http.put<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/approve`, {});
  }

  reject(issueId: number, reason: string): Observable<ApiResponse<StockIssueResponse>> {
    const body: StockIssueRejectRequest = { reason };
    return this.http.put<ApiResponse<StockIssueResponse>>(`${this.base}/${issueId}/reject`, body);
  }

  /** Returns only PENDING issues (staff submitted, awaiting manager decision) */
  getPendingForWarehouse(): Observable<ApiResponse<StockIssueResponse[]>> {
    return this.http.get<ApiResponse<StockIssueResponse[]>>(`${this.base}/warehouse/pending`);
  }

  /** Returns all issues in manager's warehouse regardless of status */
  getAllForWarehouse(): Observable<ApiResponse<StockIssueResponse[]>> {
    return this.http.get<ApiResponse<StockIssueResponse[]>>(`${this.base}/warehouse/all`);
  }
}