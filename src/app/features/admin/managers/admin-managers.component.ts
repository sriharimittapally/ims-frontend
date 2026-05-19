import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { UserResponse } from '../../../core/models/user.model';
import { WarehouseResponse } from '../../../core/models/warehouse.model';

interface ManagerView {
  manager: UserResponse;
  warehouse?: WarehouseResponse;
  staff: UserResponse[];
  expanded: boolean;
}

@Component({
  selector: 'app-admin-managers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-managers.component.html',
  styleUrls: ['./admin-managers.component.scss']
})
export class AdminManagersComponent implements OnInit {
  managerViews: ManagerView[] = [];
  filteredViews: ManagerView[] = [];
  warehouses: WarehouseResponse[] = [];
  allUsers: UserResponse[] = [];
  loading = true;
  searchText = '';
  filterStatus = '';

  constructor(private userSvc: UserService, private wSvc: WarehouseService) {}

  ngOnInit(): void {
    this.wSvc.getAll().subscribe({ next: r => { this.warehouses = r.data; this.tryBuild(); } });
    this.userSvc.getAllUsers().subscribe({ next: r => { this.allUsers = r.data; this.tryBuild(); } });
  }

  private tryBuild(): void {
    if (this.warehouses.length === 0 || this.allUsers.length === 0) return;
    this.build();
  }

  build(): void {
    const managers = this.allUsers.filter(u => u.role === 'MANAGER');
    const staff    = this.allUsers.filter(u => u.role === 'STAFF');

    this.managerViews = managers.map(mgr => ({
      manager: mgr,
      warehouse: this.warehouses.find(w => w.id === mgr.warehouseId),
      staff: staff.filter(s => s.warehouseId === mgr.warehouseId),
      expanded: false
    }));

    this.loading = false;
    this.applyFilter();
  }

  applyFilter(): void {
    let list = this.managerViews;
    if (this.filterStatus) list = list.filter(v => v.manager.status === this.filterStatus);
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(v =>
        v.manager.name.toLowerCase().includes(q) ||
        v.manager.email.toLowerCase().includes(q) ||
        (v.warehouse?.name ?? '').toLowerCase().includes(q)
      );
    }
    this.filteredViews = list;
  }

  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }

  get totalStaff(): number { return this.managerViews.reduce((s, v) => s + v.staff.length, 0); }
  get activeManagers(): number { return this.managerViews.filter(v => v.manager.status === 'ACTIVE').length; }
  get unassigned(): number { return this.managerViews.filter(v => !v.warehouse).length; }
}