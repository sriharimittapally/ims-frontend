export interface PurchaseOrderResponse {

  id: number;

  poNumber: string;

  supplierId: number;

  supplierName: string;

  supplierUserCode: string;

  companyName: string;

  warehouseId: number;

  warehouseName: string;

  warehouseCity: string;

  status: string;

  totalAmount: number;

  note?: string;

  rejectionReason?: string;

  createdByName: string;

  expectedDelivery?: string;

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

  purchasePrice: number;

  lineTotal: number;

}

export interface PurchaseOrderRequest {

  supplierId: number;

  note?: string;

  items: PurchaseOrderItemRequest[];

}

export interface PurchaseOrderItemRequest {

  productId: number;

  quantity: number;

}

export interface PurchaseOrderRejectionRequest {

  reason: string;

}