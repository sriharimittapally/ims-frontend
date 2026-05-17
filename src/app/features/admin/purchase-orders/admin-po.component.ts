import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrderResponse } from '../../../core/models/purchase-order.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-admin-po',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-po.component.html',
  styleUrls: ['./admin-po.component.scss']
})
export class AdminPoComponent implements OnInit {
  orders: PurchaseOrderResponse[] = [];
  filtered: PurchaseOrderResponse[] = [];
  loading = true;
  activeTab = 'ALL';
  selectedOrder: PurchaseOrderResponse | null = null;
  showDetail = false;

  statuses = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'SHIPPED', 'RECEIVED', 'CANCELLED', 'REJECTED'];

  constructor(private svc: PurchaseOrderService, private modal: NgbModal, private toastr: ToastrService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({ next: r => { this.orders = r.data; this.applyFilter(); this.loading = false; }, error: () => { this.loading = false; } });
  }

  applyFilter(): void {
    this.filtered = this.activeTab === 'ALL' ? this.orders : this.orders.filter(o => o.status === this.activeTab);
  }

  setTab(tab: string): void { this.activeTab = tab; this.applyFilter(); }

  countBy(status: string): number { return this.orders.filter(o => o.status === status).length; }

  viewDetail(o: PurchaseOrderResponse): void { this.selectedOrder = o; this.showDetail = true; }

  cancel(o: PurchaseOrderResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Cancel Purchase Order';
    ref.componentInstance.message = `Cancel PO <strong>${o.poNumber}</strong>?`;
    ref.componentInstance.confirmLabel = 'Cancel PO';
    ref.componentInstance.confirmClass = 'danger';
    ref.result.then(() => { this.svc.cancel(o.id).subscribe({ next: () => { this.toastr.success('PO cancelled'); this.load(); } }); }).catch(() => {});
  }

  getStatusClass(s: string): string {

  const m: Record<string, string> = {

    DRAFT: 'badge-draft',

    SENT: 'badge-sent',

    ACCEPTED: 'badge-accepted',

    SHIPPED: 'badge-shipped',

    RECEIVED: 'badge-received',

    REJECTED: 'badge-rejected',

    CANCELLED: 'badge-cancelled'

  };

  return m[s] ?? 'badge-draft';

}
}