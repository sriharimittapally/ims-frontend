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

  // ── My Issue Status Doughnut ───────────────────────────────────────────────
  issueDonutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { size: 11 } } } }
  };

  // ── Warehouse Trend Bar (last 7 days) ──────────────────────────────────────
  trendData: ChartData<'bar'> = { labels: [], datasets: [] };
  trendOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { size: 10 } } }
    }
  };

  constructor(private svc: StockIssueService, private reportSvc: ReportService) {}

  ngOnInit(): void {
    this.svc.getStaffDashboard().subscribe({
      next: r => {
        this.dashboard = r.data;
        this.loading = false;

        // Build issue donut from actual dashboard fields
        // StaffDashboardResponse: myTotalIssues, myPendingIssues, myIssuedIssues
        const pending   = r.data.myPendingIssues;
        const issued    = r.data.myIssuedIssues;
        const completed = r.data.myTotalIssues - pending - issued;

        this.issueDonutData = {
          labels: ['Pending / Draft', 'Issued', 'Other (Rejected/Cancelled)'],
          datasets: [{
            data: [pending, issued, Math.max(0, completed)],
            backgroundColor: ['#f59e0b', '#10b981', '#94a3b8'],
            borderWidth: 0,
            hoverOffset: 6
          }]
        };
      },
      error: () => { this.loading = false; }
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
          labels: r.data.dailyTrends.map(d => d.date),
          datasets: [
            { label: 'In',  data: r.data.dailyTrends.map(d => d.stockIn),  backgroundColor: 'rgba(16,185,129,0.7)',  borderRadius: 4 },
            { label: 'Out', data: r.data.dailyTrends.map(d => d.stockOut), backgroundColor: 'rgba(239,68,68,0.65)',  borderRadius: 4 }
          ]
        };
      }
    });
  }
}