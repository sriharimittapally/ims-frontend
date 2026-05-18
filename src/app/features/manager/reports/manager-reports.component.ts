import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';

Chart.register(...registerables);

@Component({
  selector: 'app-manager-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './manager-reports.component.html',
  styleUrls: ['./manager-reports.component.scss'],
})
export class ManagerReportsComponent implements OnInit {
  activeTab = 'stock';
  loading = false;

  warehouseStock: any = null;
  lowStock: any = null;
  poReport: any = null;
  staffActivity: any = null;
  topProducts: any = null;
  topBarData:any =null;

  fromDate = this.daysAgo(30);
  toDate = this.today();

  trendData: ChartData<'line'> = { labels: [], datasets: [] };
  trendOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' } },
    },
    elements: { line: { tension: 0.4 } },
  };

  staffBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' } },
    },
  };

  constructor(private svc: ReportService) {}

  ngOnInit(): void {
    this.loadStock();
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    switch (tab) {
      case 'stock':
        this.loadStock();
        break;
      case 'lowstock':
        this.loadLowStock();
        break;
      case 'trend':
        this.loadTrend();
        break;
      case 'po':
        this.loadPO();
        break;
      case 'staff':
        this.loadStaff();
        break;
      case 'top':
        this.loadTop();
        break;
    }
  }

  loadStock(): void {
    this.loading = true;
    this.svc.managerWarehouseStock().subscribe({
      next: (r) => {
        this.warehouseStock = r.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
  loadLowStock(): void {
    this.loading = true;
    this.svc.managerLowStockAlerts().subscribe({
      next: (r) => {
        this.lowStock = r.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
  loadTrend(): void {
    this.loading = true;
    this.svc.managerStockTrend(this.fromDate, this.toDate).subscribe({
      next: (r) => {
        const t = r.data;
        this.trendData = {
          labels: t.dailyTrends.map((d: any) => d.date),
          datasets: [
            {
              label: 'In',
              data: t.dailyTrends.map((d: any) => d.stockIn),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16,185,129,0.1)',
              fill: true,
            },
            {
              label: 'Out',
              data: t.dailyTrends.map((d: any) => d.stockOut),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.1)',
              fill: true,
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
  loadPO(): void {
    this.loading = true;
    this.svc.managerPOReport().subscribe({
      next: (r) => {
        this.poReport = r.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
  loadStaff(): void {
    this.loading = true;

    this.svc.managerStaffActivity().subscribe({
      next: (r) => {
        this.staffActivity = r.data;

        const staff = r.data.staffActivity;

        this.staffBarData = {
          labels: staff.map((s) => s.staffName),

          datasets: [
            {
              label: 'Total Issues',

              data: staff.map((s) => s.totalIssuesCreated),

              backgroundColor: 'rgba(99,102,241,0.7)',
            },

            {
              label: 'Issued',

              data: staff.map((s) => s.issuesIssued),

              backgroundColor: 'rgba(16,185,129,0.7)',
            },

            {
              label: 'Rejected',

              data: staff.map((s) => s.issuesRejected),

              backgroundColor: 'rgba(239,68,68,0.7)',
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
  loadTop(): void {
  this.loading = true;
  this.svc.managerTopProducts().subscribe({
    next: r => {
      this.topProducts = r.data;
      const top = (r.data.topMovingProducts ?? []).slice(0, 8);
      this.topBarData = {
        labels: top.map(p => p.productName.length > 18 ? p.productName.slice(0, 18) + '…' : p.productName),
        datasets: [{
          label: 'Units Out',
          data: top.map(p => p.totalUnitsOut),
          backgroundColor: 'rgba(6,182,212,0.75)',
          borderRadius: 6
        }]
      };
      this.loading = false;
    },
    error: () => { this.loading = false; }
  });
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
