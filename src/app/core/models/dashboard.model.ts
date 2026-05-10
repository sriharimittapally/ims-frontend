export interface AdminDashboardResponse {
  totalUsers: number;
  totalManagers: number;
  totalStaff: number;
  totalSuppliers: number;
  totalWarehouses: number;
  totalProducts: number;
  totalCategories: number;
  totalInventoryItems: number;
  pendingSupplierApprovals: number;
  pendingPurchaseOrders: number;
  lowStockAlerts: number;
  totalStockIn: number;
  totalStockOut: number;
}

export interface ManagerDashboardResponse {
  warehouseId: number;
  warehouseName: string;
  totalProducts: number;
  totalInventoryItems: number;
  lowStockAlerts: number;
  pendingIssues: number;
  totalStaff: number;
  pendingPurchaseOrders: number;
  totalStockIn: number;
  totalStockOut: number;
}

export interface StaffDashboardResponse {
  warehouseId: number;
  warehouseName: string;
  myOpenIssues: number;
  myTotalIssues: number;
  pendingPOsToReceive: number;
  totalInventoryItems: number;
}

export interface SupplierDashboardResponse {
  companyName: string;
  approvalStatus: string;
  totalPOs: number;
  pendingPOs: number;
  acceptedPOs: number;
  shippedPOs: number;
  receivedPOs: number;
  rejectedPOs: number;
  totalRevenue: number;
}