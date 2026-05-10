import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SupplierService } from '../../../core/services/supplier.service';
import { SupplierProfileResponse } from '../../../core/models/supplier.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-supplier-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supplier-management.component.html',
  styleUrls: ['./supplier-management.component.scss']
})
export class SupplierManagementComponent implements OnInit {
  suppliers: SupplierProfileResponse[] = [];
  filtered: SupplierProfileResponse[] = [];
  loading = true;
  activeTab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL';

  constructor(private svc: SupplierService, private modal: NgbModal, private toastr: ToastrService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({ next: r => { this.suppliers = r.data; this.applyFilter(); this.loading = false; }, error: () => { this.loading = false; } });
  }

  applyFilter(): void {
    this.filtered = this.activeTab === 'ALL' ? this.suppliers : this.suppliers.filter(s => s.approvalStatus === this.activeTab);
  }

  setTab(tab: 'ALL'|'PENDING'|'APPROVED'|'REJECTED'): void { this.activeTab = tab; this.applyFilter(); }

  countBy(status: string): number { return this.suppliers.filter(s => s.approvalStatus === status).length; }

  approve(s: SupplierProfileResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Approve Supplier';
    ref.componentInstance.message = `Approve <strong>${s.companyName}</strong>? They will gain access to purchase orders.`;
    ref.componentInstance.icon = 'bi-check-circle';
    ref.componentInstance.iconColor = 'var(--ims-success)';
    ref.componentInstance.confirmLabel = 'Approve';
    ref.componentInstance.confirmClass = 'success';
    ref.result.then(() => { this.svc.approve(s.id).subscribe({ next: () => { this.toastr.success('Supplier approved'); this.load(); } }); }).catch(() => {});
  }

  reject(s: SupplierProfileResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Reject Supplier';
    ref.componentInstance.message = `Reject <strong>${s.companyName}</strong>? Please provide a reason.`;
    ref.componentInstance.icon = 'bi-x-circle';
    ref.componentInstance.iconColor = 'var(--ims-danger)';
    ref.componentInstance.confirmLabel = 'Reject';
    ref.componentInstance.confirmClass = 'danger';
    ref.componentInstance.requireInput = true;
    ref.componentInstance.inputLabel = 'Rejection Reason';
    ref.componentInstance.inputPlaceholder = 'Explain why you are rejecting this supplier...';
    ref.result.then((reason: string) => {
      this.svc.reject(s.id, { reason }).subscribe({ next: () => { this.toastr.success('Supplier rejected'); this.load(); } });
    }).catch(() => {});
  }
}