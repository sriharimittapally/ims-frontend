import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ReportService } from '../../../core/services/report.service';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { ManagerDashboardResponse } from '../../../core/models/dashboard.model';

Chart.register(...registerables);

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, StatsCardComponent],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss']
})
export class ManagerDashboardComponent implements OnInit {
  dashboard: ManagerDashboardResponse | null = null;
  loading = true;

  trendData: ChartData<'line'> = { labels: [], datasets: [] };
  trendOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(148,163,184,0.1)' } } },
    elements: { line: { tension: 0.4 } }
  };

  constructor(private dashSvc: DashboardService, private reportSvc: ReportService) {}

  ngOnInit(): void {
    this.dashSvc.getManagerDashboard().subscribe({ next: r => { this.dashboard = r.data; this.loading = false; }, error: () => { this.loading = false; } });

    const from = new Date(); from.setDate(from.getDate() - 14);
    this.reportSvc.managerStockTrend(from.toISOString().split('T')[0], new Date().toISOString().split('T')[0]).subscribe(r => {
      const t = r.data;
      this.trendData = {
        labels: t.dailyTrends.map((d: any) => d.date),
        datasets: [
          { label: 'In',  data: t.dailyTrends.map((d: any) => d.stockIn),  borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true },
          { label: 'Out', data: t.dailyTrends.map((d: any) => d.stockOut), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true }
        ]
      };
    });
  }
}