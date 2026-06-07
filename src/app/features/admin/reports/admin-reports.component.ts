import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration, ChartOptions } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';
import { LowStockAlertReport, PurchaseOrderReport, SupplierPerformance } from '../../../core/models/report.model';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss'],
})
export class AdminReportsComponent implements OnInit {
  activeTab = 'inventory';
  loading = false;

  // ── Inventory ─────────────────────────────────────────────────────────────
  inventorySummary: any = null;

  // ── Low Stock ─────────────────────────────────────────────────────────────
  lowStockAlerts: LowStockAlertReport | null = null;

  // ── Stock Trend ───────────────────────────────────────────────────────────
  fromDate = this.daysAgo(30);
  toDate = this.today();
  trendData: ChartData<'line'> = { labels: [], datasets: [] };
  trendOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, beginAtZero: true },
    },
    elements: { line: { tension: 0.4 } },
  };

  // ── Supplier Performance ──────────────────────────────────────────────────
  supplierPerf: any = null;
  topSupplier: SupplierPerformance | null = null;

  // Grouped bar chart — best for comparing multiple metrics across suppliers
  supplierBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  supplierBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} POs`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(148,163,184,0.08)' },
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 11 } },
      },
    },
    interaction: { mode: 'index', intersect: false },
  };

  // ── Top Products ──────────────────────────────────────────────────────────
  topProducts: any = null;
  topBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  topBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.08)' }, beginAtZero: true, ticks: { font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  // ── PO Report ─────────────────────────────────────────────────────────────
  poReport: PurchaseOrderReport | null = null;
  poDonut: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 12, font: { size: 11 } },
      },
    },
  };
  poStatusMeta: { label: string; value: number; cls: string; icon: string; color: string }[] = [];
  poTotalSpend = 0;

  constructor(private svc: ReportService) {}

  ngOnInit(): void { this.loadInventory(); }

  setTab(tab: string): void {
    this.activeTab = tab;
    switch (tab) {
      case 'inventory':   this.loadInventory();   break;
      case 'lowstock':    this.loadLowStock();    break;
      case 'trend':       this.loadTrend();       break;
      case 'supplier':    this.loadSupplier();    break;
      case 'topproducts': this.loadTopProducts(); break;
      case 'po':          this.loadPO();          break;
    }
  }

  loadInventory(): void {
    this.loading = true;
    this.svc.adminInventorySummary().subscribe({
      next: r => { this.inventorySummary = r.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  loadLowStock(): void {
    this.loading = true;
    this.svc.adminLowStockAlerts().subscribe({
      next: r => { this.lowStockAlerts = r.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  loadTrend(): void {
    this.loading = true;
    this.svc.adminStockTrend(this.fromDate, this.toDate).subscribe({
      next: r => {
        const t = r.data;
        this.trendData = {
          labels: t.dailyTrends.map((d: any) => d.date),
          datasets: [
            { label: 'Stock In',  data: t.dailyTrends.map((d: any) => d.stockIn),  borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', fill: true },
            { label: 'Stock Out', data: t.dailyTrends.map((d: any) => d.stockOut), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)',  fill: true },
          ],
        };
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadSupplier(): void {
    this.loading = true;
    this.svc.adminSupplierPerformance().subscribe({
      next: r => {
        this.supplierPerf = r.data;
        const suppliers: SupplierPerformance[] = r.data.suppliers ?? [];

        const eligible = suppliers.filter(s => s.totalPOs >= 1);
        if (eligible.length > 0) {
          this.topSupplier = eligible.reduce((best, s) =>
            s.fulfillmentRate > best.fulfillmentRate ? s : best
          );
        }

        // Grouped bar: Accepted / Shipped / Rejected per supplier
        this.supplierBarData = {
          labels: suppliers.map(s => s.supplierName),
          datasets: [
            {
              label: 'Accepted',
              data: suppliers.map(s => s.acceptedPOs),
              backgroundColor: 'rgba(16,185,129,0.75)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Shipped',
              data: suppliers.map(s => s.shippedPOs),
              backgroundColor: 'rgba(139,92,246,0.75)',
              borderColor: '#8b5cf6',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Rejected',
              data: suppliers.map(s => s.rejectedPOs),
              backgroundColor: 'rgba(239,68,68,0.75)',
              borderColor: '#ef4444',
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        };

        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadTopProducts(): void {
    this.loading = true;
    this.svc.adminTopProducts().subscribe({
      next: r => {
        this.topProducts = r.data;
        const top = (r.data.topMovingProducts ?? []).slice(0, 8);
        this.topBarData = {
          labels: top.map((p: any) =>
            p.productName.length > 22 ? p.productName.slice(0, 22) + '…' : p.productName
          ),
          datasets: [{
            label: 'Units Out',
            data: top.map((p: any) => p.totalUnitsOut),
            backgroundColor: top.map((_: any, i: number) =>
              `hsla(${(i * 43 + 200) % 360}, 65%, 55%, 0.8)`
            ),
            borderRadius: 5,
          }],
        };
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadPO(): void {
    this.loading = true;
    this.svc.adminPOReport().subscribe({
      next: r => {
        this.poReport = r.data;
        this.poTotalSpend = r.data.totalSpend ?? 0;

        const bd = {
          DRAFT:     r.data.draftPOs,
          SENT:      r.data.sentPOs,
          ACCEPTED:  r.data.acceptedPOs,
          SHIPPED:   r.data.shippedPOs,
          RECEIVED:  r.data.receivedPOs,
          REJECTED:  r.data.rejectedPOs,
          CANCELLED: r.data.cancelledPOs,
        };

        this.poStatusMeta = [
          { label: 'Draft',     value: bd.DRAFT,     cls: 'badge-draft',     icon: 'bi-pencil-square', color: '#f59e0b' },
          { label: 'Sent',      value: bd.SENT,       cls: 'badge-sent',      icon: 'bi-send',          color: '#3b82f6' },
          { label: 'Accepted',  value: bd.ACCEPTED,   cls: 'badge-accepted',  icon: 'bi-check-circle',  color: '#10b981' },
          { label: 'Shipped',   value: bd.SHIPPED,    cls: 'badge-shipped',   icon: 'bi-truck',         color: '#8b5cf6' },
          { label: 'Received',  value: bd.RECEIVED,   cls: 'badge-received',  icon: 'bi-box-seam',      color: '#06b6d4' },
          { label: 'Rejected',  value: bd.REJECTED,   cls: 'badge-rejected',  icon: 'bi-x-circle',      color: '#ef4444' },
          { label: 'Cancelled', value: bd.CANCELLED,  cls: 'badge-cancelled', icon: 'bi-slash-circle',  color: '#64748b' },
        ];

        this.poDonut = {
          labels: this.poStatusMeta.map(s => s.label),
          datasets: [{
            data: this.poStatusMeta.map(s => s.value),
            backgroundColor: this.poStatusMeta.map(s => s.color),
            borderWidth: 0,
            hoverOffset: 6,
          }],
        };

        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getFulfillmentColor(rate: number): string {
    if (rate >= 80) return 'var(--ims-success)';
    if (rate >= 50) return 'var(--ims-warning)';
    return 'var(--ims-danger)';
  }

  getCompletionRate(po: PurchaseOrderReport): number {
    if (!po.totalPOs) return 0;
    return Math.round((po.receivedPOs / po.totalPOs) * 100);
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private daysAgo(n: number): string {
    const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0];
  }
}