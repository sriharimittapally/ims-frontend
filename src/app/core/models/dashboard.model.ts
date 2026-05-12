export interface AdminDashboardResponse {
  totalUsers: number;
  totalWarehouses: number;
  activeWarehouses: number;
  totalProducts: number;
  totalSuppliers: number;
  pendingSupplierApprovals: number;
  lowStockProducts: number;
  pendingPurchaseOrders: number;
  totalInventoryValue: number;
}

export interface ManagerDashboardResponse {
  warehouseId: number;
  warehouseName: string;
  totalStaff:number;
  totalProducts: number;
  totalInventoryItems: number;
  lowStockAlerts: number;
  pendingPurchaseOrders: number;
  pendingIssues: number; 
  warehouseInventoryValue:number
}

export interface StaffDashboardResponse {
  warehouseId: number;
  warehouseName: string;
  myTotalIssues: number;
  myPendingIssues: number;
  myIssuedIssues:number;
  pendingPOsToReceive: number;
}

export interface SupplierDashboardResponse {
  companyName: string;
  approvalStatus: string;

  linkedProducts: number;


  totalPOs: number;
  pendingPOs: number;
  acceptedPOs: number;
  shippedPOs: number;
  receivedPOs: number;
  rejectedPOs: number;

    totalRevenue: number;

}