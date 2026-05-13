import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';
import { SupplierPOReport } from '../../../core/models/report.model';

Chart.register(...registerables);

@Component({
  selector: 'app-supplier-reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './supplier-reports.component.html',
  styleUrls: ['./supplier-reports.component.scss']
})
export class SupplierReportsComponent implements OnInit {
  report: SupplierPOReport | null = null;
  loading = true;

  donutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, font: { size: 11 }, padding: 16 } }
    }
  };

  constructor(private svc: ReportService) {}

  ngOnInit(): void {
    this.svc.supplierPOReport().subscribe({
      next: r => {
        this.report = r.data;
        this.buildChart(r.data);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private buildChart(data: SupplierPOReport): void {
    const labels  = ['Sent', 'Accepted', 'Shipped', 'Received', 'Rejected'];
    const values  = [data.sentPOs, data.acceptedPOs, data.shippedPOs, data.receivedPOs, data.rejectedPOs];
    const colors  = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#ef4444'];

    this.donutData = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
  }

  getStatusClass(s: string): string {
    const m: Record<string,string> = {
      SENT:'badge-sent', ACCEPTED:'badge-active', SHIPPED:'badge-secondary',
      RECEIVED:'badge-active', REJECTED:'badge-inactive', CANCELLED:'badge-inactive'
    };
    return m[s] ?? 'badge-pending';
  }
}