import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ReportService } from '../../../core/services/report.service';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { ManagerDashboardResponse } from '../../../core/models/dashboard.model';
import { StockTrendReport } from '../../../core/models/report.model';
import { StockIssueService } from '../../../core/services/stock-issue.service';

Chart.register(...registerables);

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, StatsCardComponent],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss'],
})
export class ManagerDashboardComponent implements OnInit {
  dashboard: ManagerDashboardResponse | null = null;
  trendReport: StockTrendReport | null = null;
  loading = true;

  // ── Stock Trend ────────────────────────────────────────────────────────────
  trendData: ChartData<'line'> = { labels: [], datasets: [] };
  trendOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, font: { size: 11 } },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: 'rgba(148,163,184,0.1)' },
        ticks: { font: { size: 10 } },
      },
    },
    elements: { line: { tension: 0.4 }, point: { radius: 2, hoverRadius: 5 } },
  };

  // ── Issue Status Doughnut ─────────────────────────────────────────────────
  issueData: ChartData<'doughnut'> = {
    labels: ['Pending Approval', 'Approved', 'Issued', 'Rejected', 'Cancelled'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          '#f59e0b',
          '#10b981',
          '#06b6d4',
          '#ef4444',
          '#94a3b8',
        ],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };
  donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, font: { size: 10 }, padding: 12 },
      },
    },
  };

  constructor(
    private dashSvc: DashboardService,
    private reportSvc: ReportService,
    private issueSvc : StockIssueService
  ) {}

  ngOnInit(): void {
    this.dashSvc.getManagerDashboard().subscribe({
      next: (r) => {
        this.dashboard = r.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });

    // CORRECTED field names: dailyTrend (not dailyTrends), unitsIn (not stockIn)
    const from = new Date();
    from.setDate(from.getDate() - 14);
    this.reportSvc
      .managerStockTrend(
        from.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
      )
      .subscribe({
        next: (r) => {
          this.trendReport = r.data;
          this.trendData = {
            labels: r.data.dailyTrends.map((d) => d.date), // CORRECTED
            datasets: [
              {
                label: 'Units In',
                data: r.data.dailyTrends.map((d) => d.stockIn), // CORRECTED
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.08)',
                fill: true,
              },
              {
                label: 'Units Out',
                data: r.data.dailyTrends.map((d) => d.stockOut), // CORRECTED
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239,68,68,0.08)',
                fill: true,
              },
            ],
          };
        },
      });

      this.issueSvc.getAllForWarehouse().subscribe({
      next: r => {
        const statuses = ['PENDING', 'APPROVED', 'ISSUED', 'REJECTED', 'CANCELLED'];
        this.issueData = {
          ...this.issueData,
          datasets: [{
            ...this.issueData.datasets[0],
            data: statuses.map(s => r.data.filter(i => i.status === s).length)
          }]
        };
      }
    });


  }

get issueTotal(): number {
    return (this.issueData.datasets[0].data as number[]).reduce((sum, value) => sum + value, 0);
  }

 
}
