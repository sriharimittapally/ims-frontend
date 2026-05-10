export interface WarehouseResponse {
  id: number;
  name: string;
  location: string;
  status: string;
  managerId?: number;
  managerName?: string;
  totalProducts?: number;
  totalQuantity?: number;
  createdAt?: string;
}

export interface WarehouseRequest {
  name: string;
  location: string;
}