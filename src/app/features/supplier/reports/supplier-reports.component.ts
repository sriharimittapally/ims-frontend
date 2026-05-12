import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';

Chart.register(...registerables);

@Component({
  selector: 'app-supplier-reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './supplier-reports.component.html',
  styleUrls: ['./supplier-reports.component.scss']
})
export class SupplierReportsComponent implements OnInit {
  report: any = null;
  loading = true;

  donutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { size: 11 } } } }
  };

  constructor(private svc: ReportService) {}

  ngOnInit(): void {
    this.svc.supplierPOReport().subscribe({
      next: r => {
        this.report = r.data;
        const bd = r.data.statusBreakdown;
        this.donutData = {
          labels: Object.keys(bd),
          datasets: [{ data: Object.values(bd), backgroundColor: ['#94a3b8','#3b82f6','#10b981','#8b5cf6','#06b6d4','#ef4444','#f59e0b'], borderWidth: 0 }]
        };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getStatusClass(s: string): string {
    const m: Record<string,string> = { SENT:'badge-sent', ACCEPTED:'badge-active', SHIPPED:'badge-secondary', RECEIVED:'badge-active', REJECTED:'badge-inactive', CANCELLED:'badge-inactive' };
    return m[s] ?? 'badge-pending';
  }
}