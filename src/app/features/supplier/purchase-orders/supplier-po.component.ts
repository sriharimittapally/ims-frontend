import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrderResponse } from '../../../core/models/purchase-order.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-supplier-po',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-po.component.html',
  styleUrls: ['./supplier-po.component.scss'],
})
export class SupplierPoComponent implements OnInit {
  orders: PurchaseOrderResponse[] = [];
  loading = true;
  activeTab = 'ALL';
  selectedOrder: PurchaseOrderResponse | null = null;
  showDetail = false;

  // Ordered stages for the journey bar
  private readonly STAGE_ORDER = ['SENT', 'ACCEPTED', 'SHIPPED', 'RECEIVED'];

  constructor(
    private svc: PurchaseOrderService,
    private modal: NgbModal,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getMyPOs().subscribe({
      next: r => { this.orders = r.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  get filtered(): PurchaseOrderResponse[] {
    const list = this.activeTab === 'ALL' ? this.orders : this.orders.filter(o => o.status === this.activeTab);
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  countBy(s: string): number { return this.orders.filter(o => o.status === s).length; }

  openDetail(o: PurchaseOrderResponse): void {
    this.selectedOrder = o;
    this.showDetail = true;
  }

  /** Returns true if the PO has reached or passed the given stage */
  isStageReached(currentStatus: string, stage: string): boolean {
    const cur = this.STAGE_ORDER.indexOf(currentStatus);
    const tgt = this.STAGE_ORDER.indexOf(stage);
    if (cur === -1 || tgt === -1) return false;
    return cur >= tgt;
  }

  accept(o: PurchaseOrderResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Accept Purchase Order';
    ref.componentInstance.message = `Accept <strong>${o.poNumber}</strong>? You commit to fulfilling this order.`;
    ref.componentInstance.confirmLabel = 'Accept';
    ref.componentInstance.confirmClass = 'success';
    ref.componentInstance.icon = 'bi-check-circle';
    ref.componentInstance.iconColor = 'var(--ims-success)';
    ref.result.then(() => {
      this.svc.acceptPO(o.id).subscribe({ next: () => { this.toastr.success('PO accepted'); this.showDetail = false; this.load(); } });
    }).catch(() => {});
  }

  reject(o: PurchaseOrderResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Reject Purchase Order';
    ref.componentInstance.message = `Reject <strong>${o.poNumber}</strong>?`;
    ref.componentInstance.confirmLabel = 'Reject';
    ref.componentInstance.confirmClass = 'danger';
    ref.componentInstance.requireInput = true;
    ref.componentInstance.inputLabel = 'Reason for Rejection';
    ref.result.then((reason: string) => {
      this.svc.rejectPO(o.id, { reason }).subscribe({ next: () => { this.toastr.success('PO rejected'); this.showDetail = false; this.load(); } });
    }).catch(() => {});
  }

  ship(o: PurchaseOrderResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Mark as Shipped';
    ref.componentInstance.message = `Mark <strong>${o.poNumber}</strong> as shipped?`;
    ref.componentInstance.confirmLabel = 'Mark Shipped';
    ref.componentInstance.confirmClass = 'primary';
    ref.componentInstance.icon = 'bi-truck';
    ref.componentInstance.iconColor = 'var(--ims-primary)';
    ref.result.then(() => {
      this.svc.shipPO(o.id).subscribe({ next: () => { this.toastr.success('PO marked as shipped'); this.showDetail = false; this.load(); } });
    }).catch(() => {});
  }

  getDisplayStatus(status: string): string {
    return status === 'RECEIVED' ? 'Delivered' : this.capitalize(status);
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      SENT: 'supp-badge-sent', ACCEPTED: 'supp-badge-accepted',
      SHIPPED: 'supp-badge-shipped', RECEIVED: 'supp-badge-delivered',
      REJECTED: 'supp-badge-rejected', CANCELLED: 'supp-badge-cancelled',
    };
    return m[s] ?? 'supp-badge-cancelled';
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      SENT: 'bi-inbox', ACCEPTED: 'bi-check-circle', SHIPPED: 'bi-truck',
      RECEIVED: 'bi-inbox-fill', REJECTED: 'bi-x-circle', CANCELLED: 'bi-slash-circle',
    };
    return m[s] ?? 'bi-circle';
  }

  private capitalize(s: string): string {
    return s.charAt(0) + s.slice(1).toLowerCase();
  }
}