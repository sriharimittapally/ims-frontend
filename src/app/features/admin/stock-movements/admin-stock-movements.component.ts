
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { StockMovementService } from '../../../core/services/stock-movement.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { StockMovementResponse } from '../../../core/models/stock-movement.model';
import { WarehouseResponse } from '../../../core/models/warehouse.model';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-stock-movements',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin-stock-movements.component.html',
  styleUrls: ['./admin-stock-movements.component.scss']
})
export class AdminStockMovementsComponent implements OnInit {
  movements: StockMovementResponse[] = [];
  filtered: StockMovementResponse[] = [];
  warehouses: WarehouseResponse[] = [];
  loading = true;

  searchText = '';
  filterType      = '';   // IN | OUT
  filterWarehouse = '';
  filterRef       = '';   // PURCHASE_ORDER | STOCK_ISSUE

  // ── IN vs OUT Line Chart ─────────────────────────────────────────────────
  movementChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(148,163,184,0.1)' } } }
  };

  // ── By Warehouse Donut ───────────────────────────────────────────────────
  whDonutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { size: 11 } } } }
  };

  constructor(private svc: StockMovementService, private whSvc: WarehouseService) {}

  ngOnInit(): void {
    this.whSvc.getAll().subscribe(r => this.warehouses = r.data);
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.svc.getAllMovements().subscribe({
      next: r => { this.movements = r.data; this.applyFilter(); this.buildCharts(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    let list = this.movements;
    if (this.filterType)      list = list.filter(m => m.type === this.filterType);
    if (this.filterWarehouse)  list = list.filter(m => m.warehouseId === +this.filterWarehouse);
    if (this.filterRef)        list = list.filter(m => m.referenceType === this.filterRef);
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(m => m.productName.toLowerCase().includes(q) || m.sku.toLowerCase().includes(q));
    }
    this.filtered = list;
  }

  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }

  resetFilters(): void {
    this.filterType = ''; this.filterWarehouse = ''; this.filterRef = ''; this.searchText = '';
    this.applyFilter();
  }

  private buildCharts(): void {
    // By type per day (last 7 days)
    const days: Record<string, { IN: number; OUT: number }> = {};
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);

    this.movements.forEach(m => {
      const d = new Date(m.createdAt);
      if (d >= cutoff) {
        const key = d.toISOString().split('T')[0];
        if (!days[key]) days[key] = { IN: 0, OUT: 0 };
        days[key][m.type as 'IN'|'OUT'] += m.quantity;
      }
    });

    const labels = Object.keys(days).sort();
    this.movementChartData = {
      labels,
      datasets: [
        { label: 'Stock In',  data: labels.map(l => days[l].IN),  backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 5 },
        { label: 'Stock Out', data: labels.map(l => days[l].OUT), backgroundColor: 'rgba(239,68,68,0.65)', borderRadius: 5 }
      ]
    };

    // By warehouse
    const whMap: Record<string, number> = {};
    this.movements.forEach(m => { whMap[m.warehouseName] = (whMap[m.warehouseName] || 0) + m.quantity; });
    const whNames = Object.keys(whMap);
    this.whDonutData = {
      labels: whNames,
      datasets: [{
        data: whNames.map(n => whMap[n]),
        backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#3b82f6'],
        borderWidth: 0, hoverOffset: 6
      }]
    };
  }

  get totalIn():  number { return this.movements.filter(m => m.type === 'IN').reduce((a, m) => a + m.quantity, 0); }
  get totalOut(): number { return this.movements.filter(m => m.type === 'OUT').reduce((a, m) => a + m.quantity, 0); }
}
