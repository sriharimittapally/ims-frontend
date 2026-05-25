import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { PurchaseOrderResponse } from '../../../core/models/purchase-order.model';
import { ProductResponse } from '../../../core/models/product.model';
import { ProductSupplierResponse } from '../../../core/models/product-supplier.model';
import { InventoryResponse } from '../../../core/models/inventory.model';
import { NotificationService } from '../../../core/services/notification.service';

interface CartItem {
  product: ProductResponse;
  quantity: number;
  supplierLink: ProductSupplierResponse;
  lineTotal: number;
}

@Component({
  selector: 'app-manager-po',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-po.component.html',
  styleUrls: ['./manager-po.component.scss']
})
export class ManagerPoComponent implements OnInit {
  orders: PurchaseOrderResponse[] = [];
  loading = true;
  activeTab = 'ALL';
  statuses = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'SHIPPED', 'RECEIVED', 'CANCELLED', 'REJECTED'];

  selectedOrder: PurchaseOrderResponse | null = null;
  showDetail = false;
  actionLoading = false;
  showRejectForm = false;
  rejectReason = '';

  showWizard = false;
  wizardStep: 1 | 2 | 3 = 1;
  wizardLoading = false;

  allProducts: ProductResponse[] = [];
  warehouseInventory: InventoryResponse[] = [];
  productSearch = '';
  showOnlyLowStock = true;
  cart: CartItem[] = [];
  supplierSearch = '';
  supplierSort: 'recommended' | 'fastest' | 'cheapest' = 'recommended';

  poNote = '';
  submitLoading = false;

  constructor(
    private poSvc: PurchaseOrderService,
    private prodSvc: ProductService,
    private invSvc: InventoryService,
    private toastr: ToastrService,
    private notifSvc: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
    this.prodSvc.getAll().subscribe({
      next: r => this.allProducts = r.data.filter(p => p.status === 'ACTIVE')
    });
    this.invSvc.getMyWarehouse().subscribe({
      next: r => this.warehouseInventory = r.data
    });
  }

  load(): void {
    this.loading = true;
    this.poSvc.getMyWarehousePOs().subscribe({
      next: r => {
        this.orders = this.sortOrders(r.data);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get filtered(): PurchaseOrderResponse[] {
    const list = this.activeTab === 'ALL'
      ? this.orders
      : this.orders.filter(o => o.status === this.activeTab);
    return this.sortOrders(list);
  }

  get autoDraftOrders(): PurchaseOrderResponse[] {
    return this.orders.filter(o =>
      o.status === 'DRAFT' && (!o.createdByName || o.note?.includes('AUTO-DRAFT'))
    );
  }

  countBy(s: string): number { return this.orders.filter(o => o.status === s).length; }

  openWizard(): void {
    this.showWizard = true;
    this.wizardStep = 1;
    this.cart = [];
    this.poNote = '';
    this.productSearch = '';
    this.supplierSearch = '';
    this.supplierSort = 'recommended';
    this.showOnlyLowStock = true;
  }

  closeWizard(): void { this.showWizard = false; }

  get displayedProducts(): ProductResponse[] {
    const q = this.productSearch.trim().toLowerCase();
    let list = [...this.allProducts];

    if (this.showOnlyLowStock) {
      const lowStockIds = new Set(
        this.warehouseInventory.filter(i => i.lowStock).map(i => i.productId)
      );
      list = list.filter(p => lowStockIds.has(p.id));
    } else if (!q) {
      return [];
    }

    if (q) {
      list = list.filter(p =>
        p.productName.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      const aLow = this.getInventoryForProduct(a.id)?.lowStock ? 0 : 1;
      const bLow = this.getInventoryForProduct(b.id)?.lowStock ? 0 : 1;
      const aLinked = this.supplierOptions(a).length > 0 ? 0 : 1;
      const bLinked = this.supplierOptions(b).length > 0 ? 0 : 1;
      return aLow - bLow || aLinked - bLinked || a.productName.localeCompare(b.productName);
    });
  }

  getInventoryForProduct(productId: number): InventoryResponse | undefined {
    return this.warehouseInventory.find(i => i.productId === productId);
  }

  supplierOptions(product: ProductResponse): ProductSupplierResponse[] {
    return (product.suppliers ?? [])
      .filter(s => s.isActive)
      .sort((a, b) => this.compareSuppliers(a, b, 'recommended'));
  }

  filteredSupplierOptions(product: ProductResponse): ProductSupplierResponse[] {
    const q = this.supplierSearch.trim().toLowerCase();
    return this.supplierOptions(product)
      .filter(link => {
        const label = `${link.companyName || ''} ${link.supplierName || ''}`.toLowerCase();
        return !q || label.includes(q);
      })
      .sort((a, b) => this.compareSuppliers(a, b, this.supplierSort));
  }

  bestSupplierLink(product: ProductResponse): ProductSupplierResponse | undefined {
    return this.supplierOptions(product)[0];
  }

  isInCart(productId: number): boolean {
    return this.cart.some(c => c.product.id === productId);
  }

  getCartItem(productId: number): CartItem | undefined {
    return this.cart.find(c => c.product.id === productId);
  }

  addToCart(product: ProductResponse): void {
    if (this.isInCart(product.id)) return;
    const link = this.bestSupplierLink(product);
    if (!link) {
      this.toastr.warning('No active supplier is linked to this product.');
      return;
    }

    const inv = this.getInventoryForProduct(product.id);
    const deficit = Math.max(0, product.reorderLevel - (inv?.availableQuantity ?? 0));
    const suggestedQty = inv?.lowStock
      ? Math.max(product.reorderLevel, deficit + product.reorderLevel)
      : Math.max(1, product.reorderLevel);

    this.cart = [{
      product,
      quantity: suggestedQty,
      supplierLink: link,
      lineTotal: Number(link.purchasePrice) * suggestedQty
    }];
    this.supplierSearch = '';
    this.supplierSort = 'recommended';
  }

  canOrderProduct(product: ProductResponse): boolean {
    return this.supplierOptions(product).length > 0;
  }

  removeFromCart(productId: number): void {
    this.cart = this.cart.filter(c => c.product.id !== productId);
  }

  updateCartQty(productId: number, qty: number): void {
    const item = this.cart.find(c => c.product.id === productId);
    if (!item) return;
    item.quantity = Math.max(1, Number(qty) || 1);
    item.lineTotal = Number(item.supplierLink.purchasePrice) * item.quantity;
  }

  updateCartSupplier(productId: number, supplierLinkId: number): void {
    const item = this.cart.find(c => c.product.id === productId);
    if (!item) return;
    const link = this.supplierOptions(item.product).find(s => s.id === Number(supplierLinkId));
    if (!link) return;
    item.supplierLink = link;
    item.lineTotal = Number(link.purchasePrice) * item.quantity;
  }

  selectCartSupplier(item: CartItem, link: ProductSupplierResponse): void {
    item.supplierLink = link;
    item.lineTotal = Number(link.purchasePrice) * item.quantity;
  }

  increaseQty(item: CartItem): void {
    this.updateCartQty(item.product.id, item.quantity + 1);
  }

  decreaseQty(item: CartItem): void {
    this.updateCartQty(item.product.id, item.quantity - 1);
  }

  supplierMatchReason(link: ProductSupplierResponse): string {
    if (link.isPreferred) return 'Preferred';
    if (this.supplierSort === 'fastest') return 'Fastest option';
    if (this.supplierSort === 'cheapest') return 'Lowest cost';
    return `${link.leadTimeDays || 0} days`;
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, c) => sum + c.lineTotal, 0);
  }

  get groupedCart(): { supplierId: number; supplierName: string; items: CartItem[]; total: number }[] {
    const groups = new Map<number, { supplierId: number; supplierName: string; items: CartItem[]; total: number }>();
    this.cart.forEach(item => {
      const supplierId = item.supplierLink.supplierId;
      const supplierName = item.supplierLink.companyName || item.supplierLink.supplierName;
      if (!groups.has(supplierId)) {
        groups.set(supplierId, { supplierId, supplierName, items: [], total: 0 });
      }
      const group = groups.get(supplierId)!;
      group.items.push(item);
      group.total += item.lineTotal;
    });
    return Array.from(groups.values());
  }

  goToStep2(): void {
    if (this.cart.length === 0) {
      this.toastr.warning('Select one low-stock product first.');
      return;
    }
    this.wizardStep = 2;
  }

  goToStep3(): void {
    if (this.cart.length === 0) {
      this.toastr.warning('Please add at least one product.');
      return;
    }
    this.wizardStep = 3;
  }

  submitPO(): void {
    if (this.cart.length === 0) return;
    this.submitLoading = true;

    const item = this.cart[0];
    const request = {
      supplierId: item.supplierLink.supplierId,
      note: this.poNote?.trim() || undefined,
      items: [{
        productId: item.product.id,
        quantity: item.quantity
      }]
    };

    this.poSvc.create(request).subscribe({
      next: r => {
        this.toastr.success(`PO ${r.data.poNumber} created! Ready to send to supplier.`, 'PO Created');
        this.submitLoading = false;
        this.showWizard = false;
        this.load();
        this.notifSvc.add({
          type: 'PO_UPDATE',
          title: 'Purchase Order Created',
          message: `${r.data.poNumber} for ${r.data.companyName || r.data.supplierName} is ready to send.`,
          route: '/manager/purchase-orders'
        });
      },
      error: () => { this.submitLoading = false; }
    });
  }

  getLowStockCount(): number {
    return this.allProducts.filter(p => {
      const inv = this.getInventoryForProduct(p.id);
      return inv?.lowStock && this.supplierOptions(p).length > 0;
    }).length;
  }

  openDetail(o: PurchaseOrderResponse): void {
    this.selectedOrder = o;
    this.showDetail = true;
    this.showRejectForm = false;
    this.rejectReason = '';
  }

  closeDetail(): void { this.showDetail = false; this.selectedOrder = null; }

  sendPO(): void {
    if (!this.selectedOrder) return;
    this.actionLoading = true;
    this.poSvc.send(this.selectedOrder.id).subscribe({
      next: r => {
        this.selectedOrder = r.data;
        this.actionLoading = false;
        this.load();
        this.toastr.success(`${r.data.poNumber} sent to ${r.data.companyName || r.data.supplierName}!`);
        this.notifSvc.add({
          type: 'PO_UPDATE',
          title: 'PO Sent to Supplier',
          message: `${r.data.poNumber} sent to ${r.data.companyName}.`,
          route: '/manager/purchase-orders'
        });
      },
      error: () => { this.actionLoading = false; }
    });
  }

  cancelPO(): void {
    if (!this.selectedOrder) return;
    this.actionLoading = true;
    this.poSvc.cancel(this.selectedOrder.id).subscribe({
      next: r => {
        this.selectedOrder = r.data;
        this.actionLoading = false;
        this.load();
        this.toastr.info(`${r.data.poNumber} has been cancelled.`);
      },
      error: () => { this.actionLoading = false; }
    });
  }

  isAutoDraft(o: PurchaseOrderResponse): boolean {
    return !o.createdByName || (o.note?.includes('AUTO-DRAFT') ?? false);
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'badge-pending', SENT: 'badge-sent', ACCEPTED: 'badge-active',
      SHIPPED: 'badge-secondary', RECEIVED: 'badge-active', CANCELLED: 'badge-inactive', REJECTED: 'badge-inactive'
    };
    return m[s] ?? 'badge-pending';
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'bi-pencil-square', SENT: 'bi-send', ACCEPTED: 'bi-check-circle',
      SHIPPED: 'bi-truck', RECEIVED: 'bi-inbox-fill', CANCELLED: 'bi-slash-circle', REJECTED: 'bi-x-circle'
    };
    return m[s] ?? 'bi-circle';
  }

  private sortOrders(orders: PurchaseOrderResponse[]): PurchaseOrderResponse[] {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private compareSuppliers(
    a: ProductSupplierResponse,
    b: ProductSupplierResponse,
    mode: 'recommended' | 'fastest' | 'cheapest'
  ): number {
    if (mode === 'fastest') {
      const lead = (a.leadTimeDays ?? 9999) - (b.leadTimeDays ?? 9999);
      if (lead !== 0) return lead;
      return Number(a.purchasePrice ?? 0) - Number(b.purchasePrice ?? 0);
    }

    if (mode === 'cheapest') {
      const price = Number(a.purchasePrice ?? 0) - Number(b.purchasePrice ?? 0);
      if (price !== 0) return price;
      return (a.leadTimeDays ?? 9999) - (b.leadTimeDays ?? 9999);
    }

    const preferred = Number(b.isPreferred) - Number(a.isPreferred);
    if (preferred !== 0) return preferred;
    const lead = (a.leadTimeDays ?? 9999) - (b.leadTimeDays ?? 9999);
    if (lead !== 0) return lead;
    return Number(a.purchasePrice ?? 0) - Number(b.purchasePrice ?? 0);
  }
}