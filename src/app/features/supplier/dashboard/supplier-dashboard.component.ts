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
  revenueBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  barOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { font: { size: 12 } } }
    }
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

    // Revenue horizontal bar
    this.revenueBarData = {
      labels: ['Received', 'Shipped', 'Accepted', 'Pending', 'Rejected'],
      datasets: [{
        data: [d.receivedPOs * 100, d.shippedPOs * 80, d.acceptedPOs * 60, d.pendingPOs * 30, d.rejectedPOs * 0],
        backgroundColor: ['rgba(6,182,212,0.75)','rgba(139,92,246,0.75)','rgba(16,185,129,0.75)','rgba(245,158,11,0.75)','rgba(239,68,68,0.65)'],
        borderRadius: 6
      }]
    };
  }

  getFulfillmentRate(): number {
    if (!this.dashboard?.totalPOs) return 0;
    return Math.round((this.dashboard.receivedPOs / this.dashboard.totalPOs) * 100);
  }

  getStatusClass(s: string): string {
    const m: Record<string,string> = {
      SENT:'badge-sent', ACCEPTED:'badge-active', SHIPPED:'badge-secondary',
      RECEIVED:'badge-active', REJECTED:'badge-inactive', CANCELLED:'badge-inactive'
    };
    return m[s] ?? 'badge-pending';
  }
}