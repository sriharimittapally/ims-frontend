import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
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
statuses = [
  'ALL',
  'SENT',
  'ACCEPTED',
  'SHIPPED',
  'RECEIVED',
  'REJECTED',
  'CANCELLED'
];
  constructor(
    private svc: PurchaseOrderService,
    private modal: NgbModal,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getMyPOs().subscribe({
      next: (r) => {
        this.orders = r.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get filtered(): PurchaseOrderResponse[] {
    return this.activeTab === 'ALL'
      ? this.orders
      : this.orders.filter((o) => o.status === this.activeTab);
  }

  countBy(s: string): number {
    return this.orders.filter((o) => o.status === s).length;
  }

  accept(o: PurchaseOrderResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Accept Purchase Order';
    ref.componentInstance.message = `Accept <strong>${o.poNumber}</strong>? You agree to fulfill this order.`;
    ref.componentInstance.confirmLabel = 'Accept';
    ref.componentInstance.confirmClass = 'success';
    ref.componentInstance.icon = 'bi-check-circle';
    ref.componentInstance.iconColor = 'var(--ims-success)';
    ref.result
      .then(() => {
        this.svc.acceptPO(o.id).subscribe({
          next: () => {
            this.toastr.success('PO accepted');
            this.load();
          },
        });
      })
      .catch(() => {});
  }

  reject(o: PurchaseOrderResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Reject Purchase Order';
    ref.componentInstance.message = `Reject <strong>${o.poNumber}</strong>?`;
    ref.componentInstance.confirmLabel = 'Reject';
    ref.componentInstance.confirmClass = 'danger';
    ref.componentInstance.requireInput = true;
    ref.componentInstance.inputLabel = 'Reason for Rejection';
    ref.result
      .then((reason: string) => {
        this.svc.rejectPO(o.id, { reason }).subscribe({
          next: () => {
            this.toastr.success('PO rejected');
            this.load();
          },
        });
      })
      .catch(() => {});
  }

  ship(o: PurchaseOrderResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Mark as Shipped';
    ref.componentInstance.message = `Mark <strong>${o.poNumber}</strong> as shipped?`;
    ref.componentInstance.confirmLabel = 'Mark Shipped';
    ref.componentInstance.confirmClass = 'primary';
    ref.componentInstance.icon = 'bi-truck';
    ref.componentInstance.iconColor = 'var(--ims-info)';
    ref.result
      .then(() => {
        this.svc.shipPO(o.id).subscribe({
          next: () => {
            this.toastr.success('PO marked as shipped');
            this.load();
          },
        });
      })
      .catch(() => {});
  }

  viewDetail(o: PurchaseOrderResponse): void {
    this.selectedOrder = o;
    this.showDetail = true;
  }

  getDisplayStatus(status: string): string {

  if (status === 'RECEIVED') {
    return 'DELIVERED';
  }

  return status;

}

 getStatusClass(s: string): string {

  const displayStatus = this.getDisplayStatus(s);

  const m: Record<string, string> = {

    SENT: 'badge-sent',

    ACCEPTED: 'badge-accepted',

    SHIPPED: 'badge-shipped',

    DELIVERED: 'badge-delivered',

    REJECTED: 'badge-rejected',

    CANCELLED: 'badge-cancelled'

  };

  return m[displayStatus] ?? 'badge-draft';

}
}
