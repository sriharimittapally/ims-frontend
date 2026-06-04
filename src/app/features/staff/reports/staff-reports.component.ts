import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';
import { MyIssueHistoryReport, IssueRow } from '../../../core/models/report.model';

Chart.register(...registerables);

@Component({
  selector: 'app-staff-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './staff-reports.component.html',
  styleUrls: ['./staff-reports.component.scss'],
})
export class StaffReportsComponent implements OnInit {
  activeTab = 'history';
  loading = false;
  issueHistory: MyIssueHistoryReport | null = null;
  fromDate = this.daysAgo(14);
  toDate = this.today();
  activeRangeDays = 14;
  trendTotalIn = 0;
  trendTotalOut = 0;
  trendNet = 0;

  // Table search
  historySearch = '';
  historySortKey: 'date_desc' | 'date_asc' | 'units_desc' | 'status' = 'date_desc';

  statusBreakdown: { label: string; count: number; color: string }[] = [];
  statusBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  statusBarOpts: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.x}` } }
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { precision: 0 } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  };

  trendData: ChartData<'line'> = { labels: [], datasets: [] };
  lineOpts: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  constructor(private svc: ReportService) {}

  ngOnInit(): void { this.loadHistory(); }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'history') this.loadHistory();
    else this.loadTrend();
  }

  loadHistory(): void {
    this.loading = true;
    this.svc.staffIssueHistory().subscribe({
      next: (r) => {
        this.issueHistory = r.data;
        this.statusBreakdown = [
          { label: 'Pending', count: r.data.pendingIssues, color: '#f59e0b' },
          { label: 'Approved', count: r.data.approvedIssues, color: '#3b82f6' },
          { label: 'Issued', count: r.data.issuedIssues, color: '#10b981' },
          { label: 'Rejected', count: r.data.rejectedIssues, color: '#ef4444' },
          { label: 'Cancelled', count: r.data.cancelledIssues, color: '#64748b' },
        ];
        this.statusBarData = {
          labels: this.statusBreakdown.map(item => item.label),
          datasets: [{
            data: this.statusBreakdown.map(item => item.count),
            backgroundColor: this.statusBreakdown.map(item => item.color),
            borderWidth: 0,
            borderRadius: 6,
            barThickness: 18,
          }],
        };
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadTrend(): void {
    this.loading = true;
    this.svc.staffWarehouseTrend(this.fromDate, this.toDate).subscribe({
      next: (r) => {
        this.trendTotalIn = r.data.totalIn;
        this.trendTotalOut = r.data.totalOut;
        this.trendNet = r.data.totalIn - r.data.totalOut;
        this.trendData = {
          labels: r.data.dailyTrends.map((d) => this.formatShortDate(d.date)),
          datasets: [
            { label: 'Units In', data: r.data.dailyTrends.map((d) => d.stockIn), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', pointBackgroundColor: '#10b981', tension: 0.35, fill: true },
            { label: 'Units Out', data: r.data.dailyTrends.map((d) => d.stockOut), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)', pointBackgroundColor: '#ef4444', tension: 0.35, fill: true },
          ],
        };
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  setRange(days: number): void {
    this.activeRangeDays = days;
    this.fromDate = this.daysAgo(days);
    this.toDate = this.today();
    this.loadTrend();
  }

  get filteredIssues(): IssueRow[] {
    if (!this.issueHistory) return [];
    let rows = [...this.issueHistory.issues];
    const q = this.historySearch.trim().toLowerCase();
    if (q) rows = rows.filter(i => i.issueNumber.toLowerCase().includes(q) || (i.note && i.note.toLowerCase().includes(q)) || i.status.toLowerCase().includes(q));
    switch (this.historySortKey) {
      case 'date_desc': return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'date_asc':  return rows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'units_desc': return rows.sort((a, b) => b.totalUnits - a.totalUnits);
      case 'status': return rows.sort((a, b) => a.status.localeCompare(b.status));
    }
  }

  get approvalRate(): string {
    if (!this.issueHistory || this.issueHistory.totalIssues === 0) return '0';
    const approved = this.issueHistory.issuedIssues + this.issueHistory.approvedIssues;
    return Math.round((approved / this.issueHistory.totalIssues) * 100).toString();
  }

  get openIssueCount(): number {
    if (!this.issueHistory) return 0;
    return this.issueHistory.pendingIssues + this.issueHistory.approvedIssues;
  }

  get closedIssueCount(): number {
    if (!this.issueHistory) return 0;
    return this.issueHistory.issuedIssues + this.issueHistory.rejectedIssues + this.issueHistory.cancelledIssues;
  }

  get avgUnitsIssued(): string {
    if (!this.issueHistory || this.issueHistory.issuedIssues === 0) return '0';
    return (this.issueHistory.totalUnitsIssued / this.issueHistory.issuedIssues).toFixed(1);
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'srow-draft', PENDING: 'srow-pending',
      APPROVED: 'srow-approved', ISSUED: 'srow-issued',
      REJECTED: 'srow-rejected', CANCELLED: 'srow-cancelled',
      PENDING_APPROVAL: 'srow-pending',
    };
    return m[s] ?? 'srow-pending';
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'bi-pencil-square', PENDING: 'bi-hourglass-split', PENDING_APPROVAL: 'bi-hourglass-split',
      APPROVED: 'bi-check-circle', ISSUED: 'bi-check2-all',
      REJECTED: 'bi-x-circle', CANCELLED: 'bi-slash-circle',
    };
    return m[s] ?? 'bi-circle';
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private daysAgo(n: number): string {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  private formatShortDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }
}
