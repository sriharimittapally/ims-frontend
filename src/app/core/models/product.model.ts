import { CategoryResponse } from "./category.model";
import { ProductSupplierResponse } from "./product-supplier.model";

export interface ProductResponse {
  id: number;
  sku: string;
  productName: string;
  description: string;
  category: CategoryResponse;
  unit: string;
  reorderLevel: number;
  sellingPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  suppliers?: ProductSupplierResponse[];
}



export interface ProductRequest {
  productName: string;
  description: string;
  sku: string;
  sellingPrice: number;
  unit:string;
  reorderLevel: number;
  categoryId: number;
}

export interface SupplierLinkRequest {
  purchasePrice: number;
  leadTimeDays: boolean;
}