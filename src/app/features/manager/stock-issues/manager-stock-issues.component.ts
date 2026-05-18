import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { StockIssueService } from '../../../core/services/stock-issue.service';
import { StockIssueResponse } from '../../../core/models/stock-issue.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-manager-stock-issues',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-stock-issues.component.html',
  styleUrls: ['./manager-stock-issues.component.scss']
})
export class ManagerStockIssuesComponent implements OnInit {
  issues: StockIssueResponse[] = [];
  filtered: StockIssueResponse[] = [];
  loading = true;
  activeTab: 'PENDING' | 'ALL' = 'PENDING';

  selectedIssue: StockIssueResponse | null = null;
  showDetail = false;

  // Reject form
  showRejectForm = false;
  rejectReason = '';
  rejectLoading = false;

  // Approve loading
  approveLoading = false;
  showApproveConfirm = false;

  constructor(
    private svc: StockIssueService,
    private toastr: ToastrService,
    private notifSvc: NotificationService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    // PENDING: staff-submitted issues awaiting manager review
    // ALL: everything in this warehouse
    const obs = this.activeTab === 'PENDING'
      ? this.svc.getPendingForWarehouse()
      : this.svc.getAllForWarehouse();

    obs.subscribe({
      next: r => { this.issues = r.data; this.filtered = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  setTab(tab: 'PENDING' | 'ALL'): void { this.activeTab = tab; this.load(); }

  countByStatus(s: string): number { return this.issues.filter(i => i.status === s).length; }

  // ── APPROVE ───────────────────────────────────────────────────────────────

  approve(): void {
    if (!this.selectedIssue) return;
    this.approveLoading = true;
    this.showApproveConfirm = false;
    this.svc.approve(this.selectedIssue.id).subscribe({
      next: r => {
        this.selectedIssue = r.data;
        this.approveLoading = false;
        this.load();
        this.toastr.success(
          `${r.data.issueNumber} approved! Staff can now execute the stock out.`,
          'Issue Approved'
        );
        this.notifSvc.add({
          type: 'SI_APPROVED',
          title: 'Stock Issue Approved',
          message: `You approved ${r.data.issueNumber}. Staff will execute the stock out.`,
          route: '/manager/stock-issues'
        });
      },
      error: () => { this.approveLoading = false; }
    });
  }

  // ── REJECT ────────────────────────────────────────────────────────────────

  submitReject(): void {
    if (!this.selectedIssue || !this.rejectReason.trim()) {
      this.toastr.warning('Please provide a reason for rejection.'); return;
    }
    this.rejectLoading = true;
    this.svc.reject(this.selectedIssue.id, this.rejectReason.trim()).subscribe({
      next: r => {
        this.selectedIssue = r.data;
        this.rejectLoading = false;
        this.showRejectForm = false;
        this.rejectReason = '';
        this.load();
        this.toastr.info(`${r.data.issueNumber} has been rejected.`, 'Issue Rejected');
        this.notifSvc.add({
          type: 'SI_REJECTED',
          title: 'Stock Issue Rejected',
          message: `You rejected ${r.data.issueNumber}. Reason: ${this.rejectReason}`,
          route: '/manager/stock-issues'
        });
      },
      error: () => { this.rejectLoading = false; }
    });
  }

  // ── DETAIL ────────────────────────────────────────────────────────────────

  openDetail(issue: StockIssueResponse): void {
    this.selectedIssue = issue;
    this.showDetail = true;
    this.showRejectForm = false;
    this.showApproveConfirm = false;
    this.rejectReason = '';
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedIssue = null;
    this.showRejectForm = false;
    this.showApproveConfirm = false;
  }

  // ── STATUS HELPERS ────────────────────────────────────────────────────────

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'badge-draft', PENDING: 'badge-pending',
      APPROVED: 'badge-approved', ISSUED: 'badge-issued',
      REJECTED: 'badge-rejected', CANCELLED: 'badge-cancelled'
    };
    return m[s] ?? 'badge-pending';
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'bi-pencil-square', PENDING: 'bi-hourglass-split',
      APPROVED: 'bi-check-circle', ISSUED: 'bi-check2-all',
      REJECTED: 'bi-x-circle', CANCELLED: 'bi-slash-circle'
    };
    return m[s] ?? 'bi-circle';
  }
}