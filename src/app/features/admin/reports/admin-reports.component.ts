import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss']
})
export class AdminReportsComponent implements OnInit {
  activeTab = 'inventory';
  loading = false;

  // Inventory Summary
  inventorySummary: any = null;

  // Low Stock
  lowStockAlerts: any = null;

  // Stock Trend
  fromDate = this.daysAgo(30);
  toDate   = this.today();
  trendData: ChartData<'line'> = { labels: [], datasets: [] };
  trendOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(148,163,184,0.1)' } } },
    elements: { line: { tension: 0.4 } }
  };

  // Supplier Performance
  supplierPerf: any = null;
  perfBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  perfBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(148,163,184,0.1)' } } }
  };

  // Top Products
  topProducts: any = null;
  topBarData: ChartData<'bar'> = { labels: [], datasets: [] };

  // PO Report
  poReport: any = null;
  poDonut: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: { legend: { position: 'right', labels: { usePointStyle: true } } }
  };

  constructor(private svc: ReportService) {}

  ngOnInit(): void { this.loadInventory(); }

  setTab(tab: string): void {
    this.activeTab = tab;
    switch(tab) {
      case 'inventory':   this.loadInventory();  break;
      case 'lowstock':    this.loadLowStock();   break;
      case 'trend':       this.loadTrend();      break;
      case 'supplier':    this.loadSupplier();   break;
      case 'topproducts': this.loadTopProducts();break;
      case 'po':          this.loadPO();         break;
    }
  }

  loadInventory(): void {
    this.loading = true;
    this.svc.adminInventorySummary().subscribe({ next: r => { this.inventorySummary = r.data; this.loading = false; }, error: () => { this.loading = false; } });
  }

  loadLowStock(): void {
    this.loading = true;
    this.svc.adminLowStockAlerts().subscribe({ next: r => { this.lowStockAlerts = r.data; this.loading = false; }, error: () => { this.loading = false; } });
  }

  loadTrend(): void {
    this.loading = true;
    this.svc.adminStockTrend(this.fromDate, this.toDate).subscribe({
      next: r => {
        const t = r.data;
        this.trendData = {
          labels: t.dailyTrends.map((d: any) => d.date),
          datasets: [
            { label: 'Stock In',  data: t.dailyTrends.map((d: any) => d.stockIn),  borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true },
            { label: 'Stock Out', data: t.dailyTrends.map((d: any) => d.stockOut), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)',   fill: true }
          ]
        };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadSupplier(): void {
    this.loading = true;
    this.svc.adminSupplierPerformance().subscribe({
      next: r => {
        this.supplierPerf = r.data;
        const s = r.data.suppliers;
        this.perfBarData = {
          labels: s.map((x: any) => x.supplierName),
          datasets: [
            { label: 'Total POs',    data: s.map((x: any) => x.totalPOs),    backgroundColor: 'rgba(99,102,241,0.7)' },
            { label: 'Accepted',     data: s.map((x: any) => x.acceptedPOs), backgroundColor: 'rgba(16,185,129,0.7)' },
            { label: 'Rejected',     data: s.map((x: any) => x.rejectedPOs), backgroundColor: 'rgba(239,68,68,0.7)' }
          ]
        };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadTopProducts(): void {
    this.loading = true;
    this.svc.adminTopProducts().subscribe({
      next: r => {
        this.topProducts = r.data;
        this.topBarData = {
          labels: r.data.topMoving.map((p: any) => p.productName),
          datasets: [{ label: 'Total Movement', data: r.data.topMoving.map((p: any) => p.totalMovement), backgroundColor: 'rgba(6,182,212,0.7)', borderRadius: 6 }]
        };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadPO(): void {
    this.loading = true;
    this.svc.adminPOReport().subscribe({
      next: r => {
        this.poReport = r.data;
        const bd = r.data.statusBreakdown;
        this.poDonut = {
          labels: Object.keys(bd),
          datasets: [{ data: Object.values(bd), backgroundColor: ['#94a3b8','#3b82f6','#10b981','#8b5cf6','#06b6d4','#ef4444','#f59e0b'], borderWidth: 0 }]
        };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
}