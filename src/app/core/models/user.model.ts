export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  warehouseId?: number;
  warehouseName?: string;
  createdAt?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}