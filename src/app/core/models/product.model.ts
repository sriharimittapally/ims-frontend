import { CategoryResponse } from "./category.model";

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

export interface ProductSupplierResponse {
  id: number;
  productId:number;
  productName:string;
  sku:string;
  categoryName:string
  supplierId:number;
  supplierName: string;
  companyName:string;
  purhchasePrice: number;
  leadTimeDays:number;
  isPreferred: boolean;
  isActive:boolean;
  createdAt?:string;
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