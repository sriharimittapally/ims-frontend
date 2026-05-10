export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  sku: string;
  unitPrice: number;
  reorderLevel: number;
  categoryId: number;
  categoryName: string;
  status: string;
  suppliers?: ProductSupplierResponse[];
  createdAt?: string;
}

export interface ProductSupplierResponse {
  supplierId: number;
  supplierName: string;
  unitCost: number;
  isPreferred: boolean;
}

export interface ProductRequest {
  name: string;
  description: string;
  sku: string;
  unitPrice: number;
  reorderLevel: number;
  categoryId: number;
}

export interface SupplierLinkRequest {
  supplierId: number;
  unitCost: number;
  isPreferred: boolean;
}