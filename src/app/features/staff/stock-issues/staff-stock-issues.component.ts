import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { StockIssueService } from '../../../core/services/stock-issue.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { StockIssueResponse } from '../../../core/models/stock-issue.model';
import { InventoryResponse } from '../../../core/models/inventory.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-staff-stock-issues',
  standalone: true,
  imports: [CommonModule,FormsModule, ReactiveFormsModule],
  templateUrl: './staff-stock-issues.component.html',
  styleUrls: ['./staff-stock-issues.component.scss']
})
export class StaffStockIssuesComponent implements OnInit {
  issues: StockIssueResponse[] = [];
  inventory: InventoryResponse[] = [];
  loading = true;
  selectedIssue: StockIssueResponse | null = null;
  showDetail = false;
  addItemLoading = false;

  selectedProductId = '';
  itemQty = 1;
  noteText = '';
  createLoading = false;

  constructor(
    private svc: StockIssueService,
    private invSvc: InventoryService,
    private modal: NgbModal,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.load();
    this.invSvc.getMyWarehouse().subscribe(r => this.inventory = r.data.filter(i => i.availableQuantity > 0));
  }

  load(): void {
    this.loading = true;
    this.svc.getMyIssues().subscribe({ next: r => { this.issues = r.data; this.loading = false; }, error: () => { this.loading = false; } });
  }

  createIssue(): void {
    this.createLoading = true;
    this.svc.create(this.noteText || undefined).subscribe({
      next: r => {
        this.toastr.success('Stock issue created');
        this.createLoading = false;
        this.noteText = '';
        this.load();
        this.viewDetail(r.data);
      },
      error: () => { this.createLoading = false; }
    });
  }

  addItem(issueId: number): void {
    if (!this.selectedProductId || this.itemQty < 1) return;
    this.addItemLoading = true;
    this.svc.addItem(issueId, +this.selectedProductId, this.itemQty).subscribe({
      next: r => {
        this.toastr.success('Item added');
        this.selectedIssue = r.data;
        this.selectedProductId = '';
        this.itemQty = 1;
        this.addItemLoading = false;
        this.load();
      },
      error: () => { this.addItemLoading = false; }
    });
  }

  removeItem(issueId: number, itemId: number): void {
    this.svc.removeItem(issueId, itemId).subscribe({ next: r => { this.selectedIssue = r.data; this.toastr.success('Item removed'); this.load(); } });
  }

  submitIssue(issue: StockIssueResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Submit Stock Issue';
    ref.componentInstance.message = `Submit <strong>${issue.issueNumber}</strong> for manager approval?`;
    ref.componentInstance.confirmLabel = 'Submit for Approval';
    ref.componentInstance.confirmClass = 'primary';
    ref.componentInstance.icon = 'bi-send';
    ref.componentInstance.iconColor = 'var(--ims-primary)';
    ref.result.then(() => {
      this.svc.issueStock(issue.id).subscribe({ next: r => { this.toastr.success('Submitted for approval'); this.selectedIssue = r.data; this.load(); } });
    }).catch(() => {});
  }

  cancelIssue(issue: StockIssueResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Cancel Issue';
    ref.componentInstance.message = `Cancel <strong>${issue.issueNumber}</strong>?`;
    ref.componentInstance.confirmLabel = 'Cancel Issue';
    ref.componentInstance.confirmClass = 'danger';
    ref.result.then(() => { this.svc.cancel(issue.id).subscribe({ next: () => { this.toastr.success('Issue cancelled'); this.showDetail = false; this.load(); } }); }).catch(() => {});
  }

  viewDetail(i: StockIssueResponse): void { this.selectedIssue = i; this.showDetail = true; }

  getStatusClass(s: string): string {
    const m: Record<string,string> = { DRAFT:'badge-pending', PENDING_APPROVAL:'badge-warning', APPROVED:'badge-active', ISSUED:'badge-active', REJECTED:'badge-inactive', CANCELLED:'badge-inactive' };
    return m[s] ?? 'badge-pending';
  }
}