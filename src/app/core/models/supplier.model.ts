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
  reviewdAt:string;
}

export interface SupplierProfileRequest {
  companyName: string;
  contactPerson: string;
  phone: string;
  address: string;
}

export interface ApprovalRequest {
  reason?: string;
}