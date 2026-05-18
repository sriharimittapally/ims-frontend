import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { StockIssueService } from '../../../core/services/stock-issue.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { StockIssueResponse } from '../../../core/models/stock-issue.model';
import { InventoryResponse } from '../../../core/models/inventory.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-staff-stock-issues',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-stock-issues.component.html',
  styleUrls: ['./staff-stock-issues.component.scss']
})
export class StaffStockIssuesComponent implements OnInit {
  issues: StockIssueResponse[] = [];
  inventory: InventoryResponse[] = [];
  loading = true;

  selectedIssue: StockIssueResponse | null = null;
  showDetail = false;

  // Create form
  noteText = '';
  createLoading = false;

  // Add item form
  selectedProductId = '';
  itemQty = 1;
  addItemLoading = false;

  // Action loading states
  submitLoading = false;
  executeLoading = false;
  cancelLoading = false;

  // Confirm dialogs
  showCancelConfirm = false;
  showSubmitConfirm = false;
  showExecuteConfirm = false;
  showRejectDetails = false;

  // Filter
  activeTab: 'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'ISSUED' | 'REJECTED' | 'CANCELLED' = 'ALL';

  constructor(
    private svc: StockIssueService,
    private invSvc: InventoryService,
    private toastr: ToastrService,
    private notifSvc: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
    this.invSvc.getMyWarehouse().subscribe({
      next: r => this.inventory = r.data.filter(i => i.availableQuantity > 0)
    });
  }

  load(): void {
    this.loading = true;
    this.svc.getMyIssues().subscribe({
      next: r => { this.issues = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get filtered(): StockIssueResponse[] {
    if (this.activeTab === 'ALL') return this.issues;
    return this.issues.filter(i => i.status === this.activeTab);
  }

  countBy(status: string): number {
    return this.issues.filter(i => i.status === status).length;
  }

  // ── CREATE ────────────────────────────────────────────────────────────────

  createIssue(): void {
    this.createLoading = true;
    this.svc.create(this.noteText || undefined).subscribe({
      next: r => {
        this.toastr.success('Stock issue created! Add products then submit for manager review.', 'SI Created');
        this.createLoading = false;
        this.noteText = '';
        this.load();
        this.openDetail(r.data);
      },
      error: () => { this.createLoading = false; }
    });
  }

  // ── ITEM MANAGEMENT (only on DRAFT issues) ────────────────────────────────

  addItem(): void {
    if (!this.selectedProductId || this.itemQty < 1 || !this.selectedIssue) return;
    this.addItemLoading = true;
    this.svc.addItem(this.selectedIssue.id, +this.selectedProductId, this.itemQty).subscribe({
      next: r => {
        this.selectedIssue = r.data;
        this.selectedProductId = '';
        this.itemQty = 1;
        this.addItemLoading = false;
        this.load();
        this.toastr.success('Product added to issue.');
      },
      error: () => { this.addItemLoading = false; }
    });
  }

  removeItem(itemId: number): void {
    if (!this.selectedIssue) return;
    this.svc.removeItem(this.selectedIssue.id, itemId).subscribe({
      next: r => {
        this.selectedIssue = r.data;
        this.load();
        this.toastr.info('Product removed from issue.');
      }
    });
  }

  // ── SUBMIT (DRAFT → PENDING) ──────────────────────────────────────────────

  submitForReview(): void {
    if (!this.selectedIssue) return;
    if (this.selectedIssue.items.length === 0) {
      this.toastr.warning('Please add at least one product before submitting.'); return;
    }
    this.submitLoading = true;
    this.showSubmitConfirm = false;
    this.svc.submitForReview(this.selectedIssue.id).subscribe({
      next: r => {
        this.selectedIssue = r.data;
        this.submitLoading = false;
        this.load();
        this.toastr.success('Stock issue submitted to manager for approval!', 'Submitted');
        this.notifSvc.add({
          type: 'SI_SUBMITTED',
          title: 'Stock Issue Submitted',
          message: `${r.data.issueNumber} is now awaiting manager approval.`,
          route: '/staff/stock-issues'
        });
      },
      error: () => { this.submitLoading = false; }
    });
  }

  // ── EXECUTE STOCK OUT (APPROVED → ISSUED) ─────────────────────────────────

  executeStockOut(): void {
    if (!this.selectedIssue) return;
    this.executeLoading = true;
    this.showExecuteConfirm = false;
    this.svc.issueStock(this.selectedIssue.id).subscribe({
      next: r => {
        this.selectedIssue = r.data;
        this.executeLoading = false;
        this.load();
        this.toastr.success('Stock issued successfully! Inventory has been updated.', 'Stock Issued');
        this.notifSvc.add({
          type: 'SI_ISSUED',
          title: 'Stock Issued',
          message: `${r.data.issueNumber} has been executed. Inventory updated.`,
          route: '/staff/stock-issues'
        });
      },
      error: () => { this.executeLoading = false; }
    });
  }

  // ── CANCEL ────────────────────────────────────────────────────────────────

  cancelIssue(): void {
    if (!this.selectedIssue) return;
    this.cancelLoading = true;
    this.showCancelConfirm = false;
    this.svc.cancel(this.selectedIssue.id).subscribe({
      next: () => {
        this.cancelLoading = false;
        this.showDetail = false;
        this.load();
        this.toastr.info('Stock issue cancelled.');
      },
      error: () => { this.cancelLoading = false; }
    });
  }

  // ── DETAIL PANEL ──────────────────────────────────────────────────────────

  openDetail(issue: StockIssueResponse): void {
    this.selectedIssue = issue;
    this.showDetail = true;
    this.selectedProductId = '';
    this.itemQty = 1;
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedIssue = null;
  }

  getSelectedInventory(): InventoryResponse | undefined {
    return this.inventory.find(i => i.productId === +this.selectedProductId);
  }

  // ── STATUS HELPERS ────────────────────────────────────────────────────────

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      DRAFT:     'badge-draft',
      PENDING:   'badge-pending',
      APPROVED:  'badge-approved',
      ISSUED:    'badge-issued',
      REJECTED:  'badge-rejected',
      CANCELLED: 'badge-cancelled'
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

  canEdit(issue: StockIssueResponse): boolean { return issue.status === 'DRAFT'; }
  canSubmit(issue: StockIssueResponse): boolean { return issue.status === 'DRAFT' && issue.items.length > 0; }
  canExecute(issue: StockIssueResponse): boolean { return issue.status === 'APPROVED'; }
  canCancel(issue: StockIssueResponse): boolean {
    return issue.status === 'DRAFT' || issue.status === 'PENDING';
  }
}