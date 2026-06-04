import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ReportService } from '../../../core/services/report.service';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { AdminDashboardResponse } from '../../../core/models/dashboard.model';
import { PurchaseOrderReport, StockTrendReport } from '../../../core/models/report.model';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, StatsCardComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  dashboard: AdminDashboardResponse | null = null;
  poReport: PurchaseOrderReport | null = null;
  loading = true;

  // ── Stock Trend Line Chart ─────────────────────────────────────────────────
  trendData: ChartData<'line'> = { labels: [], datasets: [] };
  trendOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, font: { size: 12 } } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} units` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { size: 11 } } }
    },
    elements: { line: { tension: 0.4 }, point: { radius: 3, hoverRadius: 6 } }
  };

  // ── PO Status Doughnut ─────────────────────────────────────────────────────
  poDonutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { position: 'right', labels: { font: { size: 11 }, usePointStyle: true, padding: 14 } }
    }
  };

  // ── PO by Supplier Bar Chart ───────────────────────────────────────────────
  supplierBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { size: 11 } } }
    }
  };

  constructor(private dashSvc: DashboardService, private reportSvc: ReportService) {}

  ngOnInit(): void {
    // Dashboard KPIs
    this.dashSvc.getAdminDashboard().subscribe({
      next: res => { this.dashboard = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });

    // Stock Trend (last 14 days) — use correct field names from backend
    const from = new Date(); from.setDate(from.getDate() - 14);
    const fromStr = from.toISOString().split('T')[0];
    const toStr   = new Date().toISOString().split('T')[0];

    this.reportSvc.adminStockTrend(fromStr, toStr).subscribe({
      next: res => {
        const trend: StockTrendReport = res.data;
        this.trendData = {
          labels: trend.dailyTrends.map(d => d.date),   // CORRECTED: dailyTrend not dailyTrends
          datasets: [
            {
              label: 'Units In',
              // CORRECTED: unitsIn not stockIn
              data: trend.dailyTrends.map(d => d.stockIn),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16,185,129,0.08)',
              fill: true
            },
            {
              label: 'Units Out',
              // CORRECTED: unitsOut not stockOut
              data: trend.dailyTrends.map(d => d.stockOut),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.08)',
              fill: true
            }
          ]
        };
      }
    });

    // PO Report — use actual backend structure (no statusBreakdown)
    this.reportSvc.adminPOReport().subscribe({
      next: res => {
        this.poReport = res.data;
        // Build doughnut from individual status counts
        this.poDonutData = {
          labels: ['Draft', 'Sent', 'Accepted', 'Shipped', 'Received', 'Rejected', 'Cancelled'],
          datasets: [{
            data: [
              res.data.draftPOs, res.data.sentPOs, res.data.acceptedPOs,
              res.data.shippedPOs, res.data.receivedPOs, res.data.rejectedPOs, res.data.cancelledPOs
            ],
            backgroundColor: ['#94a3b8','#3b82f6','#10b981','#8b5cf6','#06b6d4','#ef4444','#64748b'],
            borderWidth: 0,
            hoverOffset: 8
          }]
        };

        // Build supplier bar from bySupplier
        if (res.data.bySupplier?.length) {
          const top5 = res.data.bySupplier.slice(0, 6);
          this.supplierBarData = {
            labels: top5.map(s => s.companyName || s.supplierName),
            datasets: [
              { label: 'Total POs',    data: top5.map(s => s.totalPOs),    backgroundColor: 'rgba(99,102,241,0.7)',   borderRadius: 6 },
              { label: 'Received POs', data: top5.map(s => s.receivedPOs), backgroundColor: 'rgba(16,185,129,0.7)',  borderRadius: 6 }
            ]
          };
        }
      }
    });
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

}