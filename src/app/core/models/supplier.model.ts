export interface SupplierProfileResponse {
  id: number;
  userId: number;
  name: string;
  email: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  address: string;
  approvalStatus: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt?: string;
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