import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';

Chart.register(...registerables);

@Component({
  selector: 'app-staff-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './staff-reports.component.html',
  styleUrls: ['./staff-reports.component.scss']
})
export class StaffReportsComponent implements OnInit {
  activeTab = 'history';
  loading = false;
  issueHistory: any = null;
  fromDate = this.daysAgo(30);
  toDate = this.today();

  trendData: ChartData<'bar'> = { labels: [], datasets: [] };
  barOptions: ChartConfiguration<'bar'>['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(148,163,184,0.1)' } } } };

  constructor(private svc: ReportService) {}

  ngOnInit(): void { this.loadHistory(); }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'history') this.loadHistory(); else this.loadTrend();
  }

  loadHistory(): void {
    this.loading = true;
    this.svc.staffIssueHistory().subscribe({ next: r => { this.issueHistory = r.data; this.loading = false; }, error: () => { this.loading = false; } });
  }

  loadTrend(): void {
    this.loading = true;
    this.svc.staffWarehouseTrend(this.fromDate, this.toDate).subscribe({
      next: r => {
        const t = r.data;
        this.trendData = { labels: t.dailyTrends.map((d: any) => d.date), datasets: [{ label: 'Stock In', data: t.dailyTrends.map((d: any) => d.stockIn), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 }, { label: 'Stock Out', data: t.dailyTrends.map((d: any) => d.stockOut), backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 4 }] };
        this.loading = false;
      }, error: () => { this.loading = false; }
    });
  }

  getStatusClass(s: string): string {
    return s === 'ISSUED' ? 'badge-active' : s === 'CANCELLED' ? 'badge-inactive' : s === 'REJECTED' ? 'badge-inactive' : 'badge-pending';
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().split('T')[0]; }
}