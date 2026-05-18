export interface StockIssueResponse {
  id: number;
  issueNumber: string;
  warehouseId: number;
  warehouseName: string;
  warehouseCity: string;
  status: string;           // DRAFT | PENDING | APPROVED | ISSUED | REJECTED | CANCELLED
  issuedByName: string;     // was createdBy — backend field is issuedByName
  approvedByName?: string;  // was approvedBy — backend field is approvedByName
  note?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  issuedAt?: string;
  items: StockIssueItemResponse[];
}

export interface StockIssueItemResponse {
  id: number;
  productId: number;
  productName: string;
  sku: string;               // was productSku — backend field is sku
  categoryName: string;
  quantityRequested: number; // was requestedQuantity — backend field is quantityRequested
  quantityIssued?: number;   // was issuedQuantity — backend field is quantityIssued
}

export interface StockIssueRejectRequest {
  reason: string;
}