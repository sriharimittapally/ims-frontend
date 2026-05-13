import { CategoryResponse } from "./category.model";

export interface SupplierProfileResponse {
  id: number;
  name:string;
  userCode: string;
  email: string;
  companyName: string;
  phone: string;
  address: string;
  gstNumber:string;
  approvalStatus: string;
  rejectionReason?: string;
  createdAt?: string;
  reviewedAt?:string;
  categories: CategoryResponse[];

}

export interface SupplierProfileRequest {
  companyName: string;
  gstNumber: string;
  phone: string;
  address: string;
  categoryIds: number[]
}

export interface ApprovalRequest {
  reason?: string;
}