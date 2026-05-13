import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ProductResponse, ProductRequest } from '../models/product.model';
import { ProductSupplierResponse, SupplierLinkRequest } from '../models/product-supplier.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  // ADMIN/MANAGER/STAFF
  getAll(): Observable<ApiResponse<ProductResponse[]>> {
    return this.http.get<ApiResponse<ProductResponse[]>>(this.base);
  }

  getActive(): Observable<ApiResponse<ProductResponse[]>> {
    return this.http.get<ApiResponse<ProductResponse[]>>(`${this.base}/active`);
  }

  getById(id: number): Observable<ApiResponse<ProductResponse>> {
    return this.http.get<ApiResponse<ProductResponse>>(`${this.base}/${id}`);
  }

  getByCategory(categoryId: number): Observable<ApiResponse<ProductResponse[]>> {
    return this.http.get<ApiResponse<ProductResponse[]>>(`${this.base}/category/${categoryId}`);
  }

  create(request: ProductRequest): Observable<ApiResponse<ProductResponse>> {
    return this.http.post<ApiResponse<ProductResponse>>(this.base, request);
  }

  update(id: number, request: ProductRequest): Observable<ApiResponse<ProductResponse>> {
    return this.http.put<ApiResponse<ProductResponse>>(`${this.base}/${id}`, request);
  }

  activate(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/${id}/activate`, {});
  }

  deactivate(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.base}/${id}`);
  }

  setPreferredSupplier(productId: number, productSupplierId: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(
      `${this.base}/${productId}/preferred-supplier/${productSupplierId}`, {}
    );
  }

  removeSupplierLink(productSupplierId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.base}/supplier-links/${productSupplierId}`);
  }

  // SUPPLIER endpoints
  getProductsInMyCategories(): Observable<ApiResponse<ProductResponse[]>> {
    return this.http.get<ApiResponse<ProductResponse[]>>(`${this.base}/my-categories`);
  }

  getMyLinkedProducts(): Observable<ApiResponse<ProductResponse[]>> {
    return this.http.get<ApiResponse<ProductResponse[]>>(`${this.base}/my-linked`);
  }

  linkProduct(productId: number, request: SupplierLinkRequest): Observable<ApiResponse<ProductSupplierResponse>> {
    return this.http.post<ApiResponse<ProductSupplierResponse>>(
      `${this.base}/${productId}/link`, request
    );
  }

  // Update price only (existing backend endpoint)
  updateMyPrice(productSupplierId: number, purchasePrice: number): Observable<ApiResponse<ProductSupplierResponse>> {
    const params = new HttpParams().set('purchasePrice', purchasePrice.toString());
    return this.http.put<ApiResponse<ProductSupplierResponse>>(
      `${this.base}/supplier-links/${productSupplierId}/price`, {}, { params }
    );
  }

  // Update both price and lead time (new backend endpoint you'll add)
  updateMyLink(productSupplierId: number, request: SupplierLinkRequest): Observable<ApiResponse<ProductSupplierResponse>> {
    return this.http.put<ApiResponse<ProductSupplierResponse>>(
      `${this.base}/supplier-links/${productSupplierId}`, request
    );
  }
}