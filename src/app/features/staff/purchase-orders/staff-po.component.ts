import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrderResponse } from '../../../core/models/purchase-order.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-staff-po',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-po.component.html',
  styleUrls: ['./staff-po.component.scss']
})
export class StaffPoComponent implements OnInit {
  pendingOrders: PurchaseOrderResponse[] = [];   // SHIPPED — to receive
  receivedOrders: PurchaseOrderResponse[] = [];  // RECEIVED — history
  loading = true;

  activeTab: 'pending' | 'history' = 'pending';
  selectedOrder: PurchaseOrderResponse | null = null;
  showDetail = false;

  // search + sort
  searchQuery = '';
  sortKey: 'date_desc' | 'date_asc' | 'supplier_az' = 'date_desc';

  receiveLoading = false;
  showReceiveConfirm = false;

  constructor(
    private svc: PurchaseOrderService,
    private toastr: ToastrService,
    private notifSvc: NotificationService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    // Load SHIPPED (pending receive)
    this.svc.getMyWarehousePOsByStatus('SHIPPED' as any).subscribe({
      next: r => {
        this.pendingOrders = r.data;
        this.loadReceived();
      },
      error: () => { this.loadReceived(); }
    });
  }

  loadReceived(): void {
    this.svc.getMyWarehousePOsByStatus('RECEIVED' as any).subscribe({
      next: r => { this.receivedOrders = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get activeOrders(): PurchaseOrderResponse[] {
    const source = this.activeTab === 'pending' ? this.pendingOrders : this.receivedOrders;
    let result = [...source];
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(o =>
        o.poNumber.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        (o.companyName && o.companyName.toLowerCase().includes(q)) ||
        o.items.some(item =>
          item.productName.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q)
        )
      );
    }
    switch (this.sortKey) {
      case 'date_desc': return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'date_asc':  return result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'supplier_az': return result.sort((a, b) => a.supplierName.localeCompare(b.supplierName));
    }
  }

  openDetail(o: PurchaseOrderResponse): void {
    this.selectedOrder = o;
    this.showDetail = true;
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedOrder = null;
    this.showReceiveConfirm = false;
  }

  confirmReceive(): void { this.showReceiveConfirm = true; }

  confirmReceiveFromRow(o: PurchaseOrderResponse, event: Event): void {
    event.stopPropagation();
    this.selectedOrder = o;
    this.showReceiveConfirm = true;
  }

  getOrderDisplayDate(o: PurchaseOrderResponse): string | undefined {
    return (o.status === 'RECEIVED' ? o.receivedAt : o.shippedAt) || o.createdAt;
  }

  receive(): void {
    if (!this.selectedOrder) return;
    this.receiveLoading = true;
    this.showReceiveConfirm = false;
    this.svc.receive(this.selectedOrder.id).subscribe({
      next: r => {
        this.toastr.success('PO received! Inventory has been updated.', 'Received');
        this.notifSvc.add({
          type: 'PO_UPDATE',
          title: 'Purchase Order Received',
          message: `${r.data.poNumber} has been received into inventory.`,
          route: '/staff/purchase-orders'
        });
        this.receiveLoading = false;
        this.closeDetail();
        this.load();
      },
      error: () => { this.receiveLoading = false; }
    });
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'badge-draft', SENT: 'badge-sent', ACCEPTED: 'badge-approved',
      SHIPPED: 'badge-shipped', RECEIVED: 'badge-received',
      CANCELLED: 'badge-cancelled', REJECTED: 'badge-rejected'
    };
    return m[s] ?? 'badge-draft';
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'bi-pencil', SENT: 'bi-send', ACCEPTED: 'bi-check-circle',
      SHIPPED: 'bi-truck', RECEIVED: 'bi-inbox-fill',
      CANCELLED: 'bi-slash-circle', REJECTED: 'bi-x-circle'
    };
    return m[s] ?? 'bi-circle';
  }

  get totalPendingValue(): number {
    return this.pendingOrders.reduce((s, o) => s + o.totalAmount, 0);
  }

  get totalReceivedValue(): number {
    return this.receivedOrders.reduce((s, o) => s + o.totalAmount, 0);
  }
}
