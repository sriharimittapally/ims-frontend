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
  loading = true;

  // Stock Trend Chart
  stockTrendData: ChartData<'line'> = { labels: [], datasets: [] };
  stockTrendOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { size: 12 }, usePointStyle: true } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { size: 11 } } }
    },
    elements: { line: { tension: 0.4 }, point: { radius: 3 } }
  };

  // PO Status Doughnut
  poStatusData: ChartData<'doughnut'> = { labels: ['Draft', 'Sent', 'Accepted', 'Shipped', 'Received', 'Cancelled', 'Rejected'], datasets: [{ data: [], backgroundColor: ['#94a3b8','#3b82f6','#10b981','#8b5cf6','#06b6d4','#ef4444','#f59e0b'], borderWidth: 0, hoverOffset: 8 }] };
  donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '72%',
    plugins: { legend: { position: 'right', labels: { font: { size: 11 }, usePointStyle: true, padding: 12 } } }
  };

  constructor(private dashSvc: DashboardService, private reportSvc: ReportService) {}

  ngOnInit(): void {
    this.dashSvc.getAdminDashboard().subscribe({
      next: res => {
        console.log(res.data);
        
         this.dashboard = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });

    const from = new Date(); from.setDate(from.getDate() - 14);
    const fromStr = from.toISOString().split('T')[0];
    const toStr = new Date().toISOString().split('T')[0];

    this.reportSvc.adminStockTrend(fromStr, toStr).subscribe(res => {
      const trend = res.data;
      this.stockTrendData = {
        labels: trend.dailyTrends.map(d => d.date),
        datasets: [
          { label: 'Stock In', data: trend.dailyTrends.map(d => d.stockIn), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true },
          { label: 'Stock Out', data: trend.dailyTrends.map(d => d.stockOut), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true }
        ]
      };
    });

    this.reportSvc.adminPOReport().subscribe(res => {
      const breakdown = res.data.statusBreakdown;
      const labels = Object.keys(breakdown);
      const values = Object.values(breakdown);
      this.poStatusData = {
        labels,
        datasets: [{ data: values, backgroundColor: ['#94a3b8','#3b82f6','#10b981','#8b5cf6','#06b6d4','#ef4444','#f59e0b'], borderWidth: 0, hoverOffset: 8 }]
      };
    });
  }
}