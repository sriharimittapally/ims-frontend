import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';
import { MyIssueHistoryReport } from '../../../core/models/report.model';

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

  // Issue status donut
  issueDonutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, font: { size: 11 } },
      },
    },
  };

  // Trend bar
  trendData: ChartData<'bar'> = { labels: [], datasets: [] };
  barOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true } } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' } },
    },
  };

  constructor(private svc: ReportService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

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
        // Build donut from CORRECTED MyIssueHistoryReport fields
        this.issueDonutData = {
          labels: ['Pending', 'Approved', 'Issued', 'Rejected', 'Cancelled'],
          datasets: [
            {
              data: [
                r.data.pendingIssues,
                r.data.approvedIssues,
                r.data.issuedIssues,
                r.data.rejectedIssues,
                r.data.cancelledIssues,
              ],
              backgroundColor: [
                '#f59e0b',
                '#3b82f6',
                '#10b981',
                '#ef4444',
                '#94a3b8',
              ],
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadTrend(): void {
    this.loading = true;
    this.svc.staffWarehouseTrend(this.fromDate, this.toDate).subscribe({
      next: (r) => {
        // CORRECTED field names
        this.trendData = {
          labels: r.data.dailyTrends.map((d) => d.date),
          datasets: [
            {
              label: 'Units In',
              data: r.data.dailyTrends.map((d) => d.stockIn),
              backgroundColor: 'rgba(16,185,129,0.7)',
              borderRadius: 4,
            },
            {
              label: 'Units Out',
              data: r.data.dailyTrends.map((d) => d.stockOut),
              backgroundColor: 'rgba(239,68,68,0.65)',
              borderRadius: 4,
            },
          ],
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'badge-pending',
      PENDING_APPROVAL: 'badge-warning',
      APPROVED: 'badge-sent',
      ISSUED: 'badge-active',
      REJECTED: 'badge-inactive',
      CANCELLED: 'badge-inactive',
    };
    return m[s] ?? 'badge-pending';
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
  private daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }
}
