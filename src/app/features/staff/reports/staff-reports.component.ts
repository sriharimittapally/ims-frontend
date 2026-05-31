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
  fromDate = this.daysAgo(30);
  toDate = this.today();

  // Table search
  historySearch = '';
  historySortKey: 'date_desc' | 'date_asc' | 'units_desc' | 'status' = 'date_desc';

  // Issue status donut
  issueDonutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, font: { size: 11 }, padding: 14 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } }
    },
  };

  // Trend bar
  trendData: ChartData<'bar'> = { labels: [], datasets: [] };
  barOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, beginAtZero: true },
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
        this.issueDonutData = {
          labels: ['Pending', 'Approved', 'Issued', 'Rejected', 'Cancelled'],
          datasets: [{
            data: [r.data.pendingIssues, r.data.approvedIssues, r.data.issuedIssues, r.data.rejectedIssues, r.data.cancelledIssues],
            backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#94a3b8'],
            borderWidth: 0,
            hoverOffset: 6,
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
        this.trendData = {
          labels: r.data.dailyTrends.map((d) => d.date),
          datasets: [
            { label: 'Units In',  data: r.data.dailyTrends.map((d) => d.stockIn),  backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 5 },
            { label: 'Units Out', data: r.data.dailyTrends.map((d) => d.stockOut), backgroundColor: 'rgba(239,68,68,0.65)',   borderRadius: 5 },
          ],
        };
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
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
}