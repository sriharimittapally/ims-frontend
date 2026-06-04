import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../../core/services/dashboard.service';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { ReportService } from '../../../core/services/report.service';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { SupplierDashboardResponse } from '../../../core/models/dashboard.model';
import { PurchaseOrderResponse } from '../../../core/models/purchase-order.model';

Chart.register(...registerables);

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, StatsCardComponent],
  templateUrl: './supplier-dashboard.component.html',
  styleUrls: ['./supplier-dashboard.component.scss']
})
export class SupplierDashboardComponent implements OnInit {
  dashboard: SupplierDashboardResponse | null = null;
  recentPOs: PurchaseOrderResponse[] = [];
  loading = true;

  // ── PO Status Doughnut ─────────────────────────────────────────────────
  poDonutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, font: { size: 12 }, padding: 16 } }
    }
  };

  // ── Revenue bar chart (per status) ────────────────────────────────────
  revenueLineData: ChartData<'line'> = { labels: [], datasets: [] };
  lineOpts: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` Rs.${this.formatCompactNumber(Number(ctx.parsed.y || 0))}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(148,163,184,0.12)' },
        ticks: {
          font: { size: 11 },
          callback: value => this.formatCompactNumber(Number(value))
        }
      }
    },
    elements: { line: { tension: 0.38 }, point: { radius: 4, hoverRadius: 6 } }
  };

  // ── PO Report doughnut (detailed) ──────────────────────────────────────
  poReportDonut: ChartData<'doughnut'> = { labels: [], datasets: [] };

  constructor(
    private dashSvc: DashboardService,
    private poSvc: PurchaseOrderService,
    private reportSvc: ReportService
  ) {}

  ngOnInit(): void {
    this.dashSvc.getSupplierDashboard().subscribe({
      next: r => {
        this.dashboard = r.data;
        this.loading = false;
        this.buildCharts(r.data);
      },
      error: () => { this.loading = false; }
    });

    // Load recent POs
    this.poSvc.getMyPOs().subscribe({
      next: r => {
        this.recentPOs = r.data
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      }
    });

    // Load PO report for detailed chart
    this.reportSvc.supplierPOReport().subscribe({
      next: r => {
        const d = r.data;
        this.poReportDonut = {
          labels: ['Sent', 'Accepted', 'Shipped', 'Received', 'Rejected'],
          datasets: [{
            data: [d.sentPOs, d.acceptedPOs, d.shippedPOs, d.receivedPOs, d.rejectedPOs],
            backgroundColor: ['#3b82f6','#10b981','#8b5cf6','#06b6d4','#ef4444'],
            borderWidth: 0, hoverOffset: 8
          }]
        };
        this.buildRevenueLine(d.orders ?? []);
      }
    });
  }

  private buildCharts(d: SupplierDashboardResponse): void {
    // Status doughnut
    this.poDonutData = {
      labels: ['Pending', 'Accepted', 'Shipped', 'Received', 'Rejected'],
      datasets: [{
        data: [d.pendingPOs, d.acceptedPOs, d.shippedPOs, d.receivedPOs, d.rejectedPOs],
        backgroundColor: ['#f59e0b','#10b981','#8b5cf6','#06b6d4','#ef4444'],
        borderWidth: 0, hoverOffset: 8
      }]
    };

    this.revenueLineData = {
      labels: ['Sent', 'Accepted', 'Shipped', 'Received'],
      datasets: [{
        data: [d.pendingPOs, d.acceptedPOs, d.shippedPOs, d.receivedPOs],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.12)',
        pointBackgroundColor: '#6366f1',
        fill: true
      }]
    };
  }

  private buildRevenueLine(orders: any[]): void {
    const recentOrders = [...orders]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-8);

    if (!recentOrders.length) return;

    this.revenueLineData = {
      labels: recentOrders.map(o => new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
      datasets: [{
        data: recentOrders.map(o => Number(o.amount || 0)),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.14)',
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        fill: true
      }]
    };
  }

  formatShortCurrency(value: number | null | undefined): string {
    return `Rs.${this.formatCompactNumber(Number(value || 0))}`;
  }

  private formatCompactNumber(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 10000000) return `${this.trimNumber(value / 10000000)}Cr`;
    if (abs >= 100000) return `${this.trimNumber(value / 100000)}L`;
    if (abs >= 1000) return `${this.trimNumber(value / 1000)}k`;
    return this.trimNumber(value);
  }

  private trimNumber(value: number): string {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1).replace(/\.0$/, '');
  }

  getFulfillmentRate(): number {
    if (!this.dashboard?.totalPOs) return 0;
    return Math.round((this.dashboard.receivedPOs / this.dashboard.totalPOs) * 100);
  }

  getDisplayStatus(status: string): string {
    return status === 'RECEIVED' ? 'Delivered' : status.charAt(0) + status.slice(1).toLowerCase();
  }

  getStatusClass(s: string): string {
    const m: Record<string,string> = {
      SENT:'supp-badge-sent', ACCEPTED:'supp-badge-accepted', SHIPPED:'supp-badge-shipped',
      RECEIVED:'supp-badge-delivered', REJECTED:'supp-badge-rejected', CANCELLED:'supp-badge-cancelled'
    };
    return m[s] ?? 'supp-badge-cancelled';
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      SENT: 'bi-inbox', ACCEPTED: 'bi-check-circle', SHIPPED: 'bi-truck',
      RECEIVED: 'bi-inbox-fill', REJECTED: 'bi-x-circle', CANCELLED: 'bi-slash-circle',
    };
    return m[s] ?? 'bi-circle';
  }
}
