
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { StockMovementService } from '../../../core/services/stock-movement.service';
import { StockMovementResponse } from '../../../core/models/stock-movement.model';

Chart.register(...registerables);

@Component({
  selector: 'app-manager-stock-movements',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './manager-stock-movements.component.html',
  styleUrls: ['./manager-stock-movements.component.scss']
})
export class ManagerStockMovementsComponent implements OnInit {
  movements: StockMovementResponse[] = [];
  filtered: StockMovementResponse[] = [];
  loading = true;
  searchText = '';
  filterType = '';
  filterRef  = '';

  trendData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(148,163,184,0.1)' } } }
  };

  constructor(private svc: StockMovementService) {}

  ngOnInit(): void {
    this.svc.getMyWarehouseMovements().subscribe({
      next: r => { this.movements = r.data; this.applyFilter(); this.buildChart(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    let list = this.movements;
    if (this.filterType) list = list.filter(m => m.type === this.filterType);
    if (this.filterRef)  list = list.filter(m => m.referenceType === this.filterRef);
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(m => m.productName.toLowerCase().includes(q) || m.sku.toLowerCase().includes(q));
    }
    this.filtered = list;
  }

  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }
  resetFilters(): void { this.filterType = ''; this.filterRef = ''; this.searchText = ''; this.applyFilter(); }

  private buildChart(): void {
    const days: Record<string, { IN: number; OUT: number }> = {};
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);

    this.movements.forEach(m => {
      const d = new Date(m.createdAt);
      if (d >= cutoff) {
        const key = d.toISOString().split('T')[0];
        if (!days[key]) days[key] = { IN: 0, OUT: 0 };
        days[key][m.type as 'IN'|'OUT'] += m.quantity;
      }
    });

    const labels = Object.keys(days).sort();
    this.trendData = {
      labels,
      datasets: [
        { label: 'Stock In',  data: labels.map(l => days[l].IN),  backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
        { label: 'Stock Out', data: labels.map(l => days[l].OUT), backgroundColor: 'rgba(239,68,68,0.65)', borderRadius: 4 }
      ]
    };
  }

  get totalIn():  number { return this.movements.filter(m => m.type === 'IN').reduce((a, m) => a + m.quantity, 0); }
  get totalOut(): number { return this.movements.filter(m => m.type === 'OUT').reduce((a, m) => a + m.quantity, 0); }
}