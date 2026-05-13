
// Exact match to backend ProductSupplierResponse DTO
export interface ProductSupplierResponse {
  id: number;
  productId:number;
  productName:string;
  sku:string;
  categoryName:string
  supplierId:number;
  supplierName: string;
  companyName:string;
  purchasePrice: number;
  leadTimeDays:number;
  isPreferred: boolean;
  isActive:boolean;
  createdAt?:string;
}

// Exact match to backend SupplierLinkRequest DTO
export interface SupplierLinkRequest {
  purchasePrice: number;
  leadTimeDays: number;
}