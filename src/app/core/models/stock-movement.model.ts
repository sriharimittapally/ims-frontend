export interface StockMovementResponse {
  id: number;
  productId: number;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  type: string;
  quantity: number;
  referenceType: string;
  referenceId: number;
  note?: string;
  createdAt: string;
}