export interface StockIssueResponse {
  id: number;
  issueNumber: string;
  warehouseId: number;
  warehouseName: string;
  createdBy: string;
  approvedBy?: string;
  status: string;
  note?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  items: StockIssueItemResponse[];
}

export interface StockIssueItemResponse {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  requestedQuantity: number;
  issuedQuantity?: number;
}

export interface StockIssueCreateRequest {
  note?: string;
}