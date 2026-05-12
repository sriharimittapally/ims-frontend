import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StockIssueService } from '../../../core/services/stock-issue.service';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { StaffDashboardResponse } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatsCardComponent],
  templateUrl: './staff-dashboard.component.html'
})
export class StaffDashboardComponent implements OnInit {
  dashboard: StaffDashboardResponse | null = null;
  loading = true;

  constructor(private svc: StockIssueService) {}

  ngOnInit(): void {
    this.svc.getStaffDashboard().subscribe({ next: r => { this.dashboard = r.data; this.loading = false; }, error: () => { this.loading = false; } });
  }
}