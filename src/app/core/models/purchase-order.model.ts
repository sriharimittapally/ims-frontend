export interface PurchaseOrderResponse {
  id: number;
  poNumber: string;
  warehouseId: number;
  warehouseName: string;
  supplierId: number;
  supplierName: string;
  status: string;
  totalAmount: number;
  note?: string;
  rejectionReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  items: PurchaseOrderItemResponse[];
}

export interface PurchaseOrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrderRequest {
  supplierId: number;
  note?: string;
  items: PurchaseOrderItemRequest[];
}

export interface PurchaseOrderItemRequest {
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrderRejectionRequest {
  reason: string;
}