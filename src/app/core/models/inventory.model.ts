export interface InventoryResponse {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  warehouseId:number;
  warehouseName: string;
  warehouseCity:string;
  quantity:number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  isLowStock: boolean;
  updatedAt: string;
}