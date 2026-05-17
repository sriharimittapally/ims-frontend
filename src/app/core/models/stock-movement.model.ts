export interface StockMovementResponse {

  id: number;

  productId: number;

  productName: string;

  sku: string;

  warehouseId: number;

  warehouseName: string;

  type: string;

  quantity: number;

  quantityAfter: number;

  referenceType: string;

  referenceId: number;

  note?: string;

  createdByName: string;

  createdAt: string;

}