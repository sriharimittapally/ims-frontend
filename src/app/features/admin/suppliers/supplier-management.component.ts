import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SupplierService } from '../../../core/services/supplier.service';
import { SupplierProfileResponse } from '../../../core/models/supplier.model';

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

  selectedSupplier: SupplierProfileResponse | null = null;
  showModal = false;
  showRejectForm = false;
  rejectReason = '';
  rejectLoading = false;
  approveLoading = false;
  revokeLoading = false;

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
    let list = this.activeTab === 'ALL'
      ? this.suppliers
      : this.suppliers.filter(s => s.approvalStatus === this.activeTab);
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(s =>
        s.companyName.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.gstNumber?.toLowerCase().includes(q) ?? false)
      );
    }
    list.sort((a, b) =>
      new Date(b.createdAt || '1970-01-01').getTime() -
      new Date(a.createdAt || '1970-01-01').getTime()
    );
    this.filtered = list;
  }

  setTab(tab: typeof this.activeTab): void { this.activeTab = tab; this.applyFilter(); }
  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }
  countBy(status: string): number { return this.suppliers.filter(s => s.approvalStatus === status).length; }

  openModal(s: SupplierProfileResponse): void {
    this.selectedSupplier = s;
    this.showModal = true;
    this.showRejectForm = false;
    this.rejectReason = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSupplier = null;
    this.showRejectForm = false;
    this.rejectReason = '';
  }

  approve(): void {
    if (!this.selectedSupplier) return;
    this.approveLoading = true;
    this.svc.approve(this.selectedSupplier.id).subscribe({
      next: () => {
        this.toastr.success(`${this.selectedSupplier!.companyName} approved!`);
        this.approveLoading = false;
        this.closeModal();
        this.load();
      },
      error: () => { this.approveLoading = false; }
    });
  }

  submitReject(): void {
    if (!this.selectedSupplier) return;
    if (!this.rejectReason.trim()) { this.toastr.warning('Please provide a rejection reason.'); return; }
    this.rejectLoading = true;
    this.svc.reject(this.selectedSupplier.id, { reason: this.rejectReason }).subscribe({
      next: () => {
        this.toastr.info(`${this.selectedSupplier!.companyName} rejected.`);
        this.rejectLoading = false;
        this.closeModal();
        this.load();
      },
      error: () => { this.rejectLoading = false; }
    });
  }

  revokeApproval(): void {
    if (!this.selectedSupplier) return;
    this.revokeLoading = true;
    this.svc.revokeApproval(this.selectedSupplier.id).subscribe({
      next: () => {
        this.toastr.warning(`Approval revoked for ${this.selectedSupplier!.companyName}. Reset to PENDING.`);
        this.revokeLoading = false;
        this.closeModal();
        this.load();
      },
      error: () => { this.revokeLoading = false; }
    });
  }

  revokeRejection(): void {
    if (!this.selectedSupplier) return;
    this.revokeLoading = true;
    this.svc.revokeRejection(this.selectedSupplier.id).subscribe({
      next: () => {
        this.toastr.success(`Rejection revoked for ${this.selectedSupplier!.companyName}. Reset to PENDING.`);
        this.revokeLoading = false;
        this.closeModal();
        this.load();
      },
      error: () => { this.revokeLoading = false; }
    });
  }

  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg,#f59e0b,#d97706)',
      'linear-gradient(135deg,#6366f1,#4f46e5)',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#ef4444,#dc2626)',
      'linear-gradient(135deg,#8b5cf6,#7c3aed)',
      'linear-gradient(135deg,#06b6d4,#0891b2)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}