import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SupplierService } from '../../../core/services/supplier.service';
import { SupplierProfileResponse } from '../../../core/models/supplier.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-supplier-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supplier-management.component.html',
  styleUrls: ['./supplier-management.component.scss']
})
export class SupplierManagementComponent implements OnInit {
  suppliers: SupplierProfileResponse[] = [];
  filtered: SupplierProfileResponse[] = [];
  loading = true;
  activeTab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL';
  searchText = '';

  // Reject inline form
  rejectingId: number | null = null;
  rejectReason = '';
  rejectLoading = false;
  approveLoading: number | null = null;

  constructor(private svc: SupplierService, private toastr: ToastrService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { this.suppliers = r.data; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    let list = this.activeTab === 'ALL' ? this.suppliers : this.suppliers.filter(s => s.approvalStatus === this.activeTab);
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(s =>
        s.companyName.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.gstNumber?.toLowerCase().includes(q)
      );
    }
    this.filtered = list;
  }

  setTab(tab: typeof this.activeTab): void { this.activeTab = tab; this.applyFilter(); }
  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }
  countBy(status: string): number { return this.suppliers.filter(s => s.approvalStatus === status).length; }

  approve(s: SupplierProfileResponse): void {
    this.approveLoading = s.id;
    this.svc.approve(s.id).subscribe({
      next: () => { this.toastr.success(`${s.companyName} approved!`); this.approveLoading = null; this.load(); },
      error: () => { this.approveLoading = null; }
    });
  }

  openReject(s: SupplierProfileResponse): void {
    this.rejectingId = s.id; this.rejectReason = '';
  }

  submitReject(s: SupplierProfileResponse): void {
    if (!this.rejectReason.trim()) { this.toastr.warning('Please provide a rejection reason.'); return; }
    this.rejectLoading = true;
    this.svc.reject(s.id, { reason: this.rejectReason }).subscribe({
      next: () => {
        this.toastr.info(`${s.companyName} rejected.`);
        this.rejectLoading = false; this.rejectingId = null; this.load();
      },
      error: () => { this.rejectLoading = false; }
    });
  }
}