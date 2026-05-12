export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  status: string;
  productCount:number;
  createdAt?: string;
}

export interface CategoryRequest {
  name: string;
  description: string;
}