import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';
import { SupplierPOReport, SupplierPORow } from '../../../core/models/report.model';

Chart.register(...registerables);

interface WarehouseInsight {
  warehouseName: string;
  orders: number;
  amount: number;
  delivered: number;
  avgOrder: number;
  contribution: number;
}

interface OrderAgingPoint {
  poNumber: string;
  status: string;
  days: number;
  amount: number;
  color: string;
}

@Component({
  selector: 'app-supplier-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './supplier-reports.component.html',
  styleUrls: ['./supplier-reports.component.scss'],
})
export class SupplierReportsComponent implements OnInit {
  report: SupplierPOReport | null = null;
  loading = true;

  historySearch = '';
  sortKey: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' = 'date_desc';

  // ── Donut ──────────────────────────────────────────────────────────────────
  private readonly chartFont = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  warehouseInsights: WarehouseInsight[] = [];
  warehouseRevenueData: ChartData<'bar'> = { labels: [], datasets: [] };
  warehouseRevenueOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { family: this.chartFont, weight: 700 },
        bodyFont: { family: this.chartFont },
        callbacks: {
          label: ctx => ` Value: ${this.formatShortCurrency(Number(ctx.parsed.x || 0))}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(148,163,184,0.12)' },
        ticks: {
          font: { family: this.chartFont, size: 11 },
          callback: value => this.formatShortCurrency(Number(value)),
        },
      },
      y: {
        grid: { display: false },
        ticks: { font: { family: this.chartFont, size: 11, weight: 600 } },
      },
    },
  };

  orderAgingPoints: OrderAgingPoint[] = [];
  orderAgingData: ChartData<'bar'> = { labels: [], datasets: [] };
  orderAgingOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { family: this.chartFont, weight: 700 },
        bodyFont: { family: this.chartFont },
        callbacks: {
          label: ctx => {
            const point = this.orderAgingPoints[ctx.dataIndex];
            return ` ${point.status}: ${point.days} day${point.days === 1 ? '' : 's'}`;
          },
          afterLabel: ctx => {
            const point = this.orderAgingPoints[ctx.dataIndex];
            return `Value: ${this.formatShortCurrency(point.amount)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: this.chartFont, size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148,163,184,0.12)' },
        ticks: { font: { family: this.chartFont, size: 11 }, precision: 0 },
      },
    },
  };

  constructor(private svc: ReportService) {}

  ngOnInit(): void {
    this.svc.supplierPOReport().subscribe({
      next: r => {
        this.report = r.data;
        this.buildWarehouseValueMix(r.data.orders ?? []);
        this.buildOrderAging(r.data.orders ?? []);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private buildWarehouseValueMix(orders: SupplierPORow[]): void {
    const colors = ['#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444'];
    const byWarehouse = new Map<string, { warehouseName: string; orders: number; amount: number; delivered: number }>();
    const totalOrderValue = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);

    orders.forEach(order => {
      const warehouseName = order.warehouseName || 'Unassigned';
      const current = byWarehouse.get(warehouseName) ?? { warehouseName, orders: 0, amount: 0, delivered: 0 };
      current.orders += 1;
      current.amount += Number(order.amount || 0);
      current.delivered += order.status === 'RECEIVED' ? 1 : 0;
      byWarehouse.set(warehouseName, current);
    });

    const rows = Array.from(byWarehouse.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    this.warehouseInsights = rows.map(row => ({
      ...row,
      avgOrder: row.orders ? row.amount / row.orders : 0,
      contribution: totalOrderValue ? Math.round((row.amount / totalOrderValue) * 100) : 0,
    }));

    this.warehouseRevenueData = {
      labels: rows.map(row => this.truncateLabel(row.warehouseName, 20)),
      datasets: [{
        data: rows.map(row => row.amount),
        backgroundColor: rows.map((_, index) => colors[index % colors.length]),
        borderWidth: 0,
        borderRadius: 6,
        barThickness: 18,
      }],
    };
  }

  private buildOrderAging(orders: SupplierPORow[]): void {
    const now = new Date();
    const recent = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .reverse();

    this.orderAgingPoints = recent.map(order => {
      const endDate = order.receivedAt ? new Date(order.receivedAt) : now;
      return {
        poNumber: order.poNumber,
        status: this.getDisplayStatus(order.status),
        days: this.daysBetween(new Date(order.createdAt), endDate),
        amount: Number(order.amount || 0),
        color: this.getStatusColor(order.status),
      };
    });

    this.orderAgingData = {
      labels: this.orderAgingPoints.map(point => this.truncateLabel(point.poNumber, 14)),
      datasets: [{
        label: 'Cycle days',
        data: this.orderAgingPoints.map(point => point.days),
        backgroundColor: this.orderAgingPoints.map(point => point.color),
        borderWidth: 0,
        borderRadius: 6,
        barThickness: 20,
      }],
    };
  }

  get filteredHistory(): SupplierPORow[] {
    if (!this.report) return [];
    let rows = [...this.report.orders];
    const q = this.historySearch.trim().toLowerCase();
    if (q) rows = rows.filter(o => o.poNumber.toLowerCase().includes(q) || o.status.toLowerCase().includes(q));
    switch (this.sortKey) {
      case 'date_desc':   return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'date_asc':    return rows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'amount_desc': return rows.sort((a, b) => b.amount - a.amount);
      case 'amount_asc':  return rows.sort((a, b) => a.amount - b.amount);
    }
  }

  get fulfillmentRate(): number {
    if (!this.report?.totalPOs) return 0;
    return Math.round((this.report.receivedPOs / this.report.totalPOs) * 100);
  }

  get acceptRate(): number {
    if (!this.report?.sentPOs) return 0;
    return Math.round((this.report.acceptedPOs / this.report.sentPOs) * 100);
  }

  get avgOrderValue(): number {
    if (!this.report?.receivedPOs) return 0;
    return this.report.totalRevenue / this.report.receivedPOs;
  }

  formatShortCurrency(value: number | null | undefined): string {
    const n = Number(value || 0);
    const abs = Math.abs(n);
    if (abs >= 10000000) return `₹${this.trim(n / 10000000)}Cr`;
    if (abs >= 100000)   return `₹${this.trim(n / 100000)}L`;
    if (abs >= 1000)     return `₹${this.trim(n / 1000)}k`;
    return `₹${this.trim(n)}`;
  }

  private trim(v: number): string {
    return Number.isInteger(v) ? v.toString() : v.toFixed(1).replace(/\.0$/, '');
  }

  private daysBetween(start: Date, end: Date): number {
    const millisPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.max(0, end.getTime() - start.getTime());
    return Math.round((diff / millisPerDay) * 10) / 10;
  }

  private truncateLabel(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
  }

  private getStatusColor(s: string): string {
    const m: Record<string, string> = {
      SENT: '#2563eb',
      ACCEPTED: '#059669',
      SHIPPED: '#7c3aed',
      RECEIVED: '#0891b2',
      REJECTED: '#dc2626',
      CANCELLED: '#64748b',
    };
    return m[s] ?? '#64748b';
  }

  getDisplayStatus(status: string): string {
    return status === 'RECEIVED' ? 'Delivered' : status.charAt(0) + status.slice(1).toLowerCase();
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      SENT: 'supp-badge-sent', ACCEPTED: 'supp-badge-accepted',
      SHIPPED: 'supp-badge-shipped', RECEIVED: 'supp-badge-delivered',
      REJECTED: 'supp-badge-rejected', CANCELLED: 'supp-badge-cancelled',
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
