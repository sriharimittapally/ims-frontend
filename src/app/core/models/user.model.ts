export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone:string;
  role: string;
  userCode:string;
  status: string;
  warehouseId?: number;
  warehouseName?: string;
  createdAt?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone:string;
}