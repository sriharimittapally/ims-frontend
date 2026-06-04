import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { StockIssueService } from '../../../core/services/stock-issue.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { StockIssueResponse } from '../../../core/models/stock-issue.model';
import { InventoryResponse } from '../../../core/models/inventory.model';
import { NotificationService } from '../../../core/services/notification.service';

type IssueStatusFilter = 'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'ISSUED' | 'REJECTED' | 'CANCELLED';

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
  searchQuery = '';

  selectedIssue: StockIssueResponse | null = null;
  showDetail = false;

  // Create form
  noteText = '';
  createLoading = false;

  // Add item form
  selectedProductId = '';
  itemQty = 1;
  addItemLoading = false;
  productPickerOpen = false;
  productSearchTerm = '';

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
  activeTab: IssueStatusFilter = 'ALL';
  statusTabs: { value: IssueStatusFilter; label: string; tone: string }[] = [
    { value: 'ALL', label: 'All', tone: 'all' },
    { value: 'DRAFT', label: 'Draft', tone: 'draft' },
    { value: 'PENDING', label: 'Submitted', tone: 'pending' },
    { value: 'APPROVED', label: 'Approved', tone: 'approved' },
    { value: 'ISSUED', label: 'Issued', tone: 'issued' },
    { value: 'REJECTED', label: 'Rejected', tone: 'rejected' },
    { value: 'CANCELLED', label: 'Cancelled', tone: 'cancelled' }
  ];

  constructor(
    private svc: StockIssueService,
    private invSvc: InventoryService,
    private toastr: ToastrService,
    private notifSvc: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadInventory();
  }

  load(): void {
    this.loading = true;
    this.svc.getMyIssues().subscribe({
      next: r => {
        this.issues = this.sortIssues(r.data);
        this.syncSelectedIssue();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get filtered(): StockIssueResponse[] {
    const byStatus = this.activeTab === 'ALL'
      ? this.issues
      : this.issues.filter(i => i.status === this.activeTab);
    const term = this.searchQuery.trim().toLowerCase();
    if (!term) return byStatus;

    return byStatus.filter(issue => {
      const itemText = issue.items
        .flatMap(item => [item.productName, item.sku, item.categoryName])
        .filter(Boolean)
        .join(' ');
      return [
        issue.issueNumber,
        issue.status,
        issue.note,
        issue.warehouseName,
        issue.approvedByName,
        itemText
      ].filter(Boolean).join(' ').toLowerCase().includes(term);
    });
  }

  countBy(status: string): number {
    return this.issues.filter(i => i.status === status).length;
  }

  countForTab(status: IssueStatusFilter): number {
    return status === 'ALL' ? this.issues.length : this.countBy(status);
  }

  loadInventory(): void {
    this.invSvc.getMyWarehouse().subscribe({
      next: r => this.inventory = r.data.filter(i => i.availableQuantity > 0)
    });
  }

  // ── CREATE ────────────────────────────────────────────────────────────────

  createIssue(): void {
    this.createLoading = true;
    this.svc.create(this.noteText || undefined).subscribe({
      next: r => {
        this.toastr.success('Stock issue created! Add products then submit for manager review.', 'SI Created');
        this.createLoading = false;
        this.noteText = '';
        this.upsertIssue(r.data);
        this.openDetail(r.data);
        this.load();
      },
      error: () => { this.createLoading = false; }
    });
  }

  // ── ITEM MANAGEMENT (only on DRAFT issues) ────────────────────────────────

  addItem(): void {
    if (!this.selectedProductId || this.itemQty < 1 || !this.selectedIssue) return;
    const selectedInventory = this.getSelectedInventory();
    const totalRequested = this.getRequestedQuantityForSelectedProduct() + this.itemQty;
    if (selectedInventory && totalRequested > selectedInventory.availableQuantity) {
      this.toastr.warning(
        `Quantity can't be greater than available stock (${selectedInventory.availableQuantity}).`,
        'Invalid Quantity'
      );
      return;
    }
    this.addItemLoading = true;
    this.svc.addItem(this.selectedIssue.id, +this.selectedProductId, this.itemQty).subscribe({
      next: r => {
        this.applyIssueUpdate(r.data);
        this.selectedProductId = '';
        this.productSearchTerm = '';
        this.productPickerOpen = false;
        this.itemQty = 1;
        this.addItemLoading = false;
        this.loadInventory();
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
        this.applyIssueUpdate(r.data);
        this.loadInventory();
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
        this.applyIssueUpdate(r.data);
        this.submitLoading = false;
        this.loadInventory();
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
        this.applyIssueUpdate(r.data);
        this.executeLoading = false;
        this.loadInventory();
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
        this.loadInventory();
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
    this.productSearchTerm = '';
    this.productPickerOpen = false;
    this.itemQty = 1;
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedIssue = null;
    this.productPickerOpen = false;
  }

  getSelectedInventory(): InventoryResponse | undefined {
    return this.inventory.find(i => i.productId === +this.selectedProductId);
  }

  getRequestedQuantityForSelectedProduct(): number {
    if (!this.selectedIssue || !this.selectedProductId) return 0;
    const existing = this.selectedIssue.items.find(i => i.productId === +this.selectedProductId);
    return existing?.quantityRequested ?? 0;
  }

  getRemainingAvailableForSelectedProduct(): number {
    const selectedInventory = this.getSelectedInventory();
    if (!selectedInventory) return 9999;
    return Math.max(0, selectedInventory.availableQuantity - this.getRequestedQuantityForSelectedProduct());
  }

  get filteredInventory(): InventoryResponse[] {
    const term = this.productSearchTerm.trim().toLowerCase();
    if (!term) return this.inventory;
    return this.inventory.filter(inv =>
      inv.productName.toLowerCase().includes(term) ||
      inv.sku.toLowerCase().includes(term) ||
      inv.categoryName.toLowerCase().includes(term)
    );
  }

  toggleProductPicker(): void {
    this.productPickerOpen = !this.productPickerOpen;
  }

  selectProduct(inv: InventoryResponse): void {
    this.selectedProductId = inv.productId.toString();
    this.productSearchTerm = '';
    this.productPickerOpen = false;
  }

  private applyIssueUpdate(issue: StockIssueResponse): void {
    this.selectedIssue = issue;
    this.upsertIssue(issue);
  }

  private upsertIssue(issue: StockIssueResponse): void {
    const exists = this.issues.some(i => i.id === issue.id);
    this.issues = this.sortIssues(exists
      ? this.issues.map(i => i.id === issue.id ? issue : i)
      : [issue, ...this.issues]
    );
  }

  private syncSelectedIssue(): void {
    if (!this.selectedIssue) return;
    const fresh = this.issues.find(i => i.id === this.selectedIssue?.id);
    if (fresh) this.selectedIssue = fresh;
  }

  private sortIssues(issues: StockIssueResponse[]): StockIssueResponse[] {
    return [...issues].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

  getRowActionLabel(issue: StockIssueResponse): string {
    const m: Record<string, string> = {
      DRAFT: issue.items.length > 0 ? 'Submit' : 'Add items',
      PENDING: 'Awaiting approval',
      APPROVED: 'Execute',
      ISSUED: 'Executed',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled'
    };
    return m[issue.status] ?? 'Open';
  }

  getRowActionIcon(issue: StockIssueResponse): string {
    const m: Record<string, string> = {
      DRAFT: issue.items.length > 0 ? 'bi-send' : 'bi-plus-circle',
      PENDING: 'bi-hourglass-split',
      APPROVED: 'bi-check2-all',
      ISSUED: 'bi-check2-circle',
      REJECTED: 'bi-x-circle',
      CANCELLED: 'bi-slash-circle'
    };
    return m[issue.status] ?? 'bi-box-arrow-up-right';
  }

  handleRowAction(issue: StockIssueResponse, event?: Event): void {
    event?.stopPropagation();
    this.selectedIssue = issue;

    if (this.canSubmit(issue)) {
      this.showSubmitConfirm = true;
      return;
    }

    if (this.canExecute(issue)) {
      this.showExecuteConfirm = true;
      return;
    }

    this.openDetail(issue);
  }

  canEdit(issue: StockIssueResponse): boolean { return issue.status === 'DRAFT'; }
  canSubmit(issue: StockIssueResponse): boolean { return issue.status === 'DRAFT' && issue.items.length > 0; }
  canExecute(issue: StockIssueResponse): boolean { return issue.status === 'APPROVED'; }
  canCancel(issue: StockIssueResponse): boolean {
    return issue.status === 'DRAFT' || issue.status === 'PENDING';
  }
}
