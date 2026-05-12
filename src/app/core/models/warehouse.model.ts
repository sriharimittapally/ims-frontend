export interface WarehouseResponse {
  id: number;
  name: string;
  address: string;
  city:string;
  status: string;
  managerId?: number;
  managerName?: string;
  createdAt?: string;
  updatedAt?:string;
}

export interface WarehouseRequest {
  name: string;
  address: string;
  city:string;
}