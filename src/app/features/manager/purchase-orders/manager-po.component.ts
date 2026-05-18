import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { PurchaseOrderResponse } from '../../../core/models/purchase-order.model';
import { SupplierProfileResponse } from '../../../core/models/supplier.model';
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './manager-po.component.html',
  styleUrls: ['./manager-po.component.scss']
})
export class ManagerPoComponent implements OnInit {

  // ── Orders ────────────────────────────────────────────────────────────────
  orders: PurchaseOrderResponse[] = [];
  loading = true;
  activeTab = 'ALL';
  statuses = ['ALL','DRAFT','SENT','ACCEPTED','SHIPPED','RECEIVED','CANCELLED','REJECTED'];

  // ── Detail Panel ──────────────────────────────────────────────────────────
  selectedOrder: PurchaseOrderResponse | null = null;
  showDetail = false;
  actionLoading = false;
  showRejectForm = false;
  rejectReason = '';

  // ── Create Wizard ─────────────────────────────────────────────────────────
  showWizard = false;
  wizardStep: 1 | 2 | 3 = 1;
  wizardLoading = false;

  // Step 1: supplier selection
  suppliers: SupplierProfileResponse[] = [];
  selectedSupplier: SupplierProfileResponse | null = null;
  supplierSearch = '';

  // Step 2: product selection
  allProducts: ProductResponse[] = [];
  warehouseInventory: InventoryResponse[] = [];
  supplierProducts: ProductResponse[] = [];   // products this supplier can supply
  productSearch = '';
  showOnlyLowStock = false;
  cart: CartItem[] = [];

  // Step 3: review
  poNote = '';
  submitLoading = false;

  constructor(
    private poSvc: PurchaseOrderService,
    private supSvc: SupplierService,
    private prodSvc: ProductService,
    private invSvc: InventoryService,
    private toastr: ToastrService,
    private notifSvc: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
    this.supSvc.getAll().subscribe({
      next: r => this.suppliers = r.data.filter(s => s.approvalStatus === 'APPROVED')
    });
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
      next: r => { this.orders = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get filtered(): PurchaseOrderResponse[] {
    return this.activeTab === 'ALL' ? this.orders : this.orders.filter(o => o.status === this.activeTab);
  }

  get autoDraftOrders(): PurchaseOrderResponse[] {
    return this.orders.filter(o =>
      o.status === 'DRAFT' && (!o.createdByName || o.note?.includes('AUTO-DRAFT'))
    );
  }

  countBy(s: string): number { return this.orders.filter(o => o.status === s).length; }

  // ── Wizard ────────────────────────────────────────────────────────────────

  openWizard(): void {
    this.showWizard = true;
    this.wizardStep = 1;
    this.selectedSupplier = null;
    this.cart = [];
    this.poNote = '';
    this.supplierSearch = '';
    this.productSearch = '';
    this.showOnlyLowStock = false;
  }

  closeWizard(): void { this.showWizard = false; }

  // Step 1: select supplier
  get filteredSuppliers(): SupplierProfileResponse[] {
    const q = this.supplierSearch.toLowerCase();
    return this.suppliers.filter(s =>
      !q || s.companyName.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }

  selectSupplier(s: SupplierProfileResponse): void {
    this.selectedSupplier = s;
  }

  goToStep2(): void {
    if (!this.selectedSupplier) { this.toastr.warning('Please select a supplier first.'); return; }
    // Filter products that this supplier can supply
    this.supplierProducts = this.allProducts.filter(p =>
      p.suppliers?.some(sl => sl.supplierId === this.selectedSupplier!.id)
    );
    this.wizardStep = 2;
  }

  // Step 2: select products from cart
  get displayedProducts(): ProductResponse[] {
    let list = this.supplierProducts;
    if (this.showOnlyLowStock) {
      const lowStockIds = new Set(
        this.warehouseInventory.filter(i => i.isLowStock).map(i => i.productId)
      );
      list = list.filter(p => lowStockIds.has(p.id));
    }
    if (this.productSearch) {
      const q = this.productSearch.toLowerCase();
      list = list.filter(p =>
        p.productName.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getInventoryForProduct(productId: number): InventoryResponse | undefined {
    return this.warehouseInventory.find(i => i.productId === productId);
  }

  getSupplierLink(product: ProductResponse): ProductSupplierResponse | undefined {
    return product.suppliers?.find(s => s.supplierId === this.selectedSupplier?.id);
  }

  isInCart(productId: number): boolean {
    return this.cart.some(c => c.product.id === productId);
  }

  getCartItem(productId: number): CartItem | undefined {
    return this.cart.find(c => c.product.id === productId);
  }

  addToCart(product: ProductResponse): void {
    if (this.isInCart(product.id)) return;
    const link = this.getSupplierLink(product);
    if (!link) return;
    const inv = this.getInventoryForProduct(product.id);
    const suggestedQty = inv?.isLowStock ? product.reorderLevel * 2 : product.reorderLevel;
    this.cart.push({
      product,
      quantity: Math.max(1, suggestedQty),
      supplierLink: link,
      lineTotal: link.purchasePrice * suggestedQty
    });
  }

  removeFromCart(productId: number): void {
    this.cart = this.cart.filter(c => c.product.id !== productId);
  }

  updateCartQty(productId: number, qty: number): void {
    const item = this.cart.find(c => c.product.id === productId);
    if (!item) return;
    item.quantity = Math.max(1, qty);
    item.lineTotal = item.supplierLink.purchasePrice * item.quantity;
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, c) => sum + c.lineTotal, 0);
  }

  goToStep3(): void {
    if (this.cart.length === 0) { this.toastr.warning('Please add at least one product.'); return; }
    this.wizardStep = 3;
  }

  submitPO(): void {
    if (!this.selectedSupplier || this.cart.length === 0) return;
    this.submitLoading = true;

    const payload = {
      supplierId: this.selectedSupplier.id,
      note: this.poNote || undefined,
      items: this.cart.map(c => ({
        productId: c.product.id,
        quantity:  c.quantity
      }))
    };

    this.poSvc.create(payload).subscribe({
      next: r => {
        this.toastr.success(`PO ${r.data.poNumber} created! Ready to send to supplier.`, 'PO Created');
        this.submitLoading = false;
        this.showWizard = false;
        this.load();
        this.notifSvc.add({
          type: 'PO_UPDATE',
          title: 'Purchase Order Created',
          message: `${r.data.poNumber} for ${this.selectedSupplier!.companyName} is ready to send.`,
          route: '/manager/purchase-orders'
        });
      },
      error: () => { this.submitLoading = false; }
    });
  }

  getLowStockCount(): number {
    return this.supplierProducts.filter(p => {
      const inv = this.getInventoryForProduct(p.id);
      return inv?.isLowStock;
    }).length;
  }

  // ── Detail Panel ──────────────────────────────────────────────────────────

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
    const m: Record<string,string> = {
      DRAFT:'badge-pending', SENT:'badge-sent', ACCEPTED:'badge-active',
      SHIPPED:'badge-secondary', RECEIVED:'badge-active', CANCELLED:'badge-inactive', REJECTED:'badge-inactive'
    };
    return m[s] ?? 'badge-pending';
  }

  getStatusIcon(s: string): string {
    const m: Record<string,string> = {
      DRAFT:'bi-pencil-square', SENT:'bi-send', ACCEPTED:'bi-check-circle',
      SHIPPED:'bi-truck', RECEIVED:'bi-inbox-fill', CANCELLED:'bi-slash-circle', REJECTED:'bi-x-circle'
    };
    return m[s] ?? 'bi-circle';
  }
}