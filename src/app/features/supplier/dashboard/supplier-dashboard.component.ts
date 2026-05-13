import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { SupplierDashboardResponse } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatsCardComponent],
  templateUrl: './supplier-dashboard.component.html',
  styleUrls: ['./supplier-dashboard.component.scss']
})
export class SupplierDashboardComponent implements OnInit {
  dashboard: SupplierDashboardResponse | null = null;
  loading = true;

  constructor(private svc: DashboardService) {}

  ngOnInit(): void {
    this.svc.getSupplierDashboard().subscribe({
      next: r => { this.dashboard = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}