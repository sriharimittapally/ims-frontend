import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { StockIssueService } from '../../../core/services/stock-issue.service';
import { StockIssueResponse } from '../../../core/models/stock-issue.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-manager-stock-issues',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-stock-issues.component.html',
  styleUrls: ['./manager-stock-issues.component.scss']
})
export class ManagerStockIssuesComponent implements OnInit {
  issues: StockIssueResponse[] = [];
  loading = true;
  activeTab: 'PENDING' | 'ALL' = 'PENDING';
  selectedIssue: StockIssueResponse | null = null;
  showDetail = false;

  constructor(private svc: StockIssueService, private modal: NgbModal, private toastr: ToastrService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const obs = this.activeTab === 'PENDING' ? this.svc.getPendingForWarehouse() : this.svc.getAllForWarehouse();
    obs.subscribe({ next: r => { this.issues = r.data; this.loading = false; }, error: () => { this.loading = false; } });
  }

  setTab(tab: 'PENDING'|'ALL'): void { this.activeTab = tab; this.load(); }

  approve(issue: StockIssueResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Approve Stock Issue';
    ref.componentInstance.message = `Approve <strong>${issue.issueNumber}</strong>? Stock will be reserved.`;
    ref.componentInstance.confirmLabel = 'Approve';
    ref.componentInstance.confirmClass = 'success';
    ref.componentInstance.icon = 'bi-check-circle';
    ref.componentInstance.iconColor = 'var(--ims-success)';
    ref.result.then(() => { this.svc.approve(issue.id).subscribe({ next: () => { this.toastr.success('Stock issue approved'); this.load(); } }); }).catch(() => {});
  }

  reject(issue: StockIssueResponse): void {
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = 'Reject Stock Issue';
    ref.componentInstance.message = `Reject <strong>${issue.issueNumber}</strong>?`;
    ref.componentInstance.confirmLabel = 'Reject';
    ref.componentInstance.confirmClass = 'danger';
    ref.componentInstance.requireInput = true;
    ref.componentInstance.inputLabel = 'Rejection Reason';
    ref.result.then((reason: string) => { this.svc.reject(issue.id, reason).subscribe({ next: () => { this.toastr.success('Issue rejected'); this.load(); } }); }).catch(() => {});
  }

  viewDetail(i: StockIssueResponse): void { this.selectedIssue = i; this.showDetail = true; }

  getStatusClass(s: string): string {
    const m: Record<string, string> = { DRAFT:'badge-pending', PENDING_APPROVAL:'badge-warning', APPROVED:'badge-active', ISSUED:'badge-active', REJECTED:'badge-inactive', CANCELLED:'badge-inactive' };
    return m[s] ?? 'badge-pending';
  }
}