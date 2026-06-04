import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { StockIssueService } from '../../../core/services/stock-issue.service';
import { ReportService } from '../../../core/services/report.service';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { StaffDashboardResponse } from '../../../core/models/dashboard.model';

Chart.register(...registerables);

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, StatsCardComponent],
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.scss']
})
export class StaffDashboardComponent implements OnInit {
  dashboard: StaffDashboardResponse | null = null;
  loading = true;
  issueBreakdown: { label: string; count: number; color: string }[] = [];

  // ── My Issue Status Doughnut ───────────────────────────────────────────────
  issueDonutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { display: false } }
  };

  // ── Warehouse Trend Bar (last 7 days) ──────────────────────────────────────
  trendData: ChartData<'bar'> = { labels: [], datasets: [] };
  trendOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 10 } } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { size: 10 } } }
    }
  };

  constructor(private svc: StockIssueService, private reportSvc: ReportService) {}

  ngOnInit(): void {
    this.svc.getStaffDashboard().subscribe({
      next: r => {
        this.dashboard = r.data;
        this.loading = false;

        this.setIssueBreakdown([
          { label: 'Pending', count: r.data.myPendingIssues, color: '#f59e0b' },
          { label: 'Issued', count: r.data.myIssuedIssues, color: '#10b981' },
          { label: 'Other', count: Math.max(0, r.data.myTotalIssues - r.data.myPendingIssues - r.data.myIssuedIssues), color: '#94a3b8' }
        ]);
      },
      error: () => { this.loading = false; }
    });

    this.reportSvc.staffIssueHistory().subscribe({
      next: r => {
        const d = r.data;
        const draft = Math.max(0, d.totalIssues - d.pendingIssues - d.approvedIssues - d.issuedIssues - d.rejectedIssues - d.cancelledIssues);
        this.setIssueBreakdown([
          { label: 'Draft', count: draft, color: '#64748b' },
          { label: 'Pending', count: d.pendingIssues, color: '#f59e0b' },
          { label: 'Approved', count: d.approvedIssues, color: '#3b82f6' },
          { label: 'Issued', count: d.issuedIssues, color: '#10b981' },
          { label: 'Rejected', count: d.rejectedIssues, color: '#ef4444' },
          { label: 'Cancelled', count: d.cancelledIssues, color: '#475569' }
        ]);
      }
    });

    // Warehouse trend (last 7 days)
    const from = new Date(); from.setDate(from.getDate() - 7);
    this.reportSvc.staffWarehouseTrend(
      from.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    ).subscribe({
      next: r => {
        // CORRECTED field names
        this.trendData = {
          labels: r.data.dailyTrends.map(d => this.formatShortDate(d.date)),
          datasets: [
            { label: 'In',  data: r.data.dailyTrends.map(d => d.stockIn),  backgroundColor: 'rgba(16,185,129,0.7)',  borderRadius: 4 },
            { label: 'Out', data: r.data.dailyTrends.map(d => d.stockOut), backgroundColor: 'rgba(239,68,68,0.65)',  borderRadius: 4 }
          ]
        };
      }
    });
  }

  get issueTotal(): number {
    return this.issueBreakdown.reduce((sum, item) => sum + item.count, 0);
  }

  issuePercent(count: number): number {
    return this.issueTotal ? Math.round((count / this.issueTotal) * 100) : 0;
  }

  private setIssueBreakdown(items: { label: string; count: number; color: string }[]): void {
    this.issueBreakdown = items.filter(item => item.count > 0);
    const chartItems = this.issueBreakdown.length
      ? this.issueBreakdown
      : [{ label: 'No issues', count: 1, color: '#e2e8f0' }];

    this.issueDonutData = {
      labels: chartItems.map(item => item.label),
      datasets: [{
        data: chartItems.map(item => item.count),
        backgroundColor: chartItems.map(item => item.color),
        borderWidth: 0,
        hoverOffset: 6
      }]
    };
  }

  private formatShortDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }
}
