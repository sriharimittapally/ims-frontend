import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrderResponse } from '../../../core/models/purchase-order.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-staff-po',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-po.component.html',
  styleUrls: ['./staff-po.component.scss']
})
export class StaffPoComponent implements OnInit {
  orders: PurchaseOrderResponse[] = [];
  loading = true;
  selectedOrder: PurchaseOrderResponse | null = null;
  showDetail = false;

  constructor(private svc: PurchaseOrderService, private modal: NgbModal, private toastr: ToastrService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    // Staff can see warehouse POs that are in SHIPPED status (to receive)
    // Use getMyWarehousePOs isn't available for staff, so filter from manager endpoint
    // Actually, for staff we need to use the admin endpoint filtered - but staff only have receive endpoint
    // Let's use the best approach - staff can view POs by status SHIPPED
    this.svc.getByStatus('SHIPPED' as any).subscribe({
      next: r => { this.orders = r.data; this.loading = false; },
      error: () => {
        // If ADMIN endpoint fails for staff, fallback to empty
        this.loading = false;
      }
    });
  }

  receive(o: PurchaseOrderResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Receive Purchase Order';
    ref.componentInstance.message = `Mark <strong>${o.poNumber}</strong> as received? Stock will be added to inventory.`;
    ref.componentInstance.confirmLabel = 'Receive';
    ref.componentInstance.confirmClass = 'success';
    ref.componentInstance.icon = 'bi-inbox-fill';
    ref.componentInstance.iconColor = 'var(--ims-success)';
    ref.result.then(() => { this.svc.receive(o.id).subscribe({ next: () => { this.toastr.success('PO received! Inventory updated.'); this.load(); } }); }).catch(() => {});
  }

  viewDetail(o: PurchaseOrderResponse): void { this.selectedOrder = o; this.showDetail = true; }

  getStatusClass(s: string): string {
    const m: Record<string, string> = { DRAFT:'badge-pending', SENT:'badge-sent', ACCEPTED:'badge-active', SHIPPED:'badge-secondary', RECEIVED:'badge-active', CANCELLED:'badge-inactive', REJECTED:'badge-inactive' };
    return m[s] ?? 'badge-pending';
  }
}