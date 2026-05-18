export interface PurchaseOrderResponse {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  supplierUserCode: string;
  companyName: string;          // backend sends companyName
  warehouseId: number;
  warehouseName: string;
  warehouseCity: string;
  status: string;
  totalAmount: number;
  note?: string;
  rejectionReason?: string;
  createdByName?: string;       // null = AUTO-DRAFT by system
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
  shippedAt?: string;
  receivedAt?: string;
  items: PurchaseOrderItemResponse[];
}

export interface PurchaseOrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  quantity: number;
  purchasePrice: number;        // backend field name
  lineTotal: number;            // backend field name
}

export interface PurchaseOrderRequest {
  supplierId: number;
  note?: string;
  items: PurchaseOrderItemRequest[];
}

export interface PurchaseOrderItemRequest {
  productId: number;
  quantity: number;
  // NO unitCost — backend auto-looks up from ProductSupplier table
}

export interface PurchaseOrderRejectionRequest {
  reason: string;
}