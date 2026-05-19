export interface InventorySummaryReport {
  totalProducts: number;
  totalQuantity: number;
  totalWarehouses: number;
  lowStockCount: number;
  outOfStockCount: number;
  warehouseBreakdowns: WarehouseBreakdown[];
}

export interface WarehouseBreakdown {
  warehouseId: number;
  warehouseName: string;
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  inventoryValue:number;
}

export interface LowStockAlertReport {
  totalAlerts: number;
  alerts: LowStockAlertRow[];
}

export interface LowStockAlertRow {
  productId: number;

  sku: string;

  productName: string;

  categoryName: string;

  warehouseId: number;

  warehouseName: string;

  currentStock: number;

  reservedQuantity: number;

  availableQuantity: number;

  reorderLevel: number;

  deficit: number;

  hasPreferredSupplier: boolean;

  preferredSupplierName?: string;

  autoDraftExists: boolean;
}
export interface PurchaseOrderReport {

  totalPOs: number;

  draftPOs: number;

  sentPOs: number;

  acceptedPOs: number;

  shippedPOs: number;

  receivedPOs: number;

  rejectedPOs: number;

  cancelledPOs: number;

  totalSpend: number;

  bySupplier: POBySupplierRow[];

  byWarehouse: POByWarehouseRow[];

}

export interface POBySupplierRow {

  supplierId: number;

  supplierName: string;

  companyName: string;

  totalPOs: number;

  receivedPOs: number;

  totalAmount: number;

}

export interface POByWarehouseRow {

  warehouseId: number;

  warehouseName: string;

  totalPOs: number;

  receivedPOs: number;

  totalAmount: number;

}

export interface SupplierPerformanceReport {
  suppliers: SupplierPerformance[];
}

export interface SupplierPerformance {
  supplierId: number;
  supplierName: string;
  totalPOs: number;
  acceptedPOs: number;
  rejectedPOs: number;
  shippedPOs: number;
  fulfillmentRate: number;
  totalSpend: number;
}

export interface StockTrendReport {

  warehouseName: string;

  period: string;

  totalIn: number;

  totalOut: number;

  dailyTrends: DailyTrend[];

}

export interface DailyTrend {

  date: string;

  stockIn: number;

  stockOut: number;

  net: number;

}

export interface TopProductsReport {

  scope: string;

  topMovingProducts: ProductMovement[];

  slowMovingProducts: ProductMovement[];

}

export interface ProductMovement {

  productId: number;

  sku: string;

  productName: string;

  categoryName: string;

  totalUnitsOut: number;

  currentStock: number;

  stockValue: number;

}

export interface WarehouseStockReport {
  warehouseId: number;
  warehouseName: string;
  items: WarehouseStockItem[];
}

export interface WarehouseStockItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  isLowStock: boolean;
}

export interface StaffActivityReport {

  warehouseId: number;

  warehouseName: string;

  staffActivity: StaffActivity[];

}

export interface StaffActivity {

  staffId: number;

  staffName: string;

  userCode: string;

  totalIssuesCreated: number;

  issuesPending: number;

  issuesApproved: number;

  issuesIssued: number;

  issuesRejected: number;

  issuesCancelled: number;

  totalUnitsIssued: number;

}

export interface MyIssueHistoryReport {

  staffName: string;

  warehouseName: string;

  totalIssues: number;

  pendingIssues: number;

  approvedIssues: number;

  issuedIssues: number;

  rejectedIssues: number;

  cancelledIssues: number;

  totalUnitsIssued: number;

  issues: IssueRow[];

}

export interface IssueRow {

  issueId: number;

  issueNumber: string;

  status: string;

  itemCount: number;

  totalUnits: number;

  createdAt: string;

  issuedAt?: string;

  note?: string;

}

export interface SupplierPOReport {
  companyName: string;

  totalPOs: number;

  sentPOs: number;
  acceptedPOs: number;
  shippedPOs: number;
  receivedPOs: number;
  rejectedPOs: number;

  totalRevenue: number;

  orders: SupplierPORow[];
}

export interface SupplierPORow {
  id: number;
  poNumber: string;

  status: string;

  warehouseName: string;

  amount: number;

  itemCount: number;


  createdAt: string;

  shippedAt?: string;

  receivedAt?: string;
}