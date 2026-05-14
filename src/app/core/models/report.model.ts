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
  alerts: LowStockItem[];
}

export interface LowStockItem {
  productId: number;
  productName: string;
  sku: string;
  warehouseId: number;
  warehouseName: string;
  currentQuantity: number;
  reorderLevel: number;
}

export interface PurchaseOrderReport {
  totalPOs: number;
  totalAmount: number;
  statusBreakdown: Record<string, number>;
  recentOrders: PurchaseOrderSummary[];
}

export interface PurchaseOrderSummary {
  poNumber: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
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
  from: string;
  to: string;
  dailyTrends: DailyTrend[];
  totalIn: number;
  totalOut: number;
}

export interface DailyTrend {
  date: string;
  stockIn: number;
  stockOut: number;
}

export interface TopProductsReport {
  topMoving: ProductMovement[];
  slowMoving: ProductMovement[];
}

export interface ProductMovement {
  productId: number;
  productName: string;
  sku: string;
  totalMovement: number;
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
  staff: StaffActivity[];
}

export interface StaffActivity {
  staffId: number;
  staffName: string;
  totalIssues: number;
  issuedCount: number;
  rejectedCount: number;
  cancelledCount: number;
}

export interface MyIssueHistoryReport {
  totalIssues: number;
  issuedCount: number;
  cancelledCount: number;
  rejectedCount: number;
  issues: SupplierPORow[];
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