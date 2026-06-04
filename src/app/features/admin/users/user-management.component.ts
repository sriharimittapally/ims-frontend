import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../core/models/user.model';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { WarehouseResponse } from '../../../core/models/warehouse.model';
import { NotificationService } from '../../../core/services/notification.service';

interface ManagerCard {
  manager: UserResponse;
  warehouse: WarehouseResponse | undefined;
  staff: UserResponse[];
  staffExpanded: boolean;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  users: UserResponse[] = [];
  warehouses: WarehouseResponse[] = [];
  filtered: UserResponse[] = [];
  loading = true;
  searchText = '';

  activeTab: 'ALL' | 'MANAGER' | 'STAFF' | 'SUPPLIER' | 'MANAGER_SERVICE' =
    'ALL';

  // Create form
  createForm: FormGroup;
  createRole: 'MANAGER' | 'STAFF' = 'MANAGER';
  createLoading = false;
  showCreateModal = false;

  // Manager service view
  managerCards: ManagerCard[] = [];
  selectedManagerCard: ManagerCard | null = null;
  showManagerDetail = false;

  // Toggle action tracking
  togglingUserId: number | null = null;

  constructor(
    private userSvc: UserService,
    private wSvc: WarehouseService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private notifSvc: NotificationService,
  ) {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      warehouseId: [null],
    });
  }

  ngOnInit(): void {
    this.load();
    this.wSvc.getAll().subscribe({ next: (r) => (this.warehouses = r.data) });
  }

  load(): void {
    this.loading = true;
    this.userSvc.getAllUsers().subscribe({
      next: (res) => {
        this.users = res.data;
        this.applyFilter();
        this.buildManagerCards();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    let list = this.users;

    // Exclude admins
    list = list.filter((u) => u.role !== 'ADMIN');

    if (this.activeTab !== 'ALL' && this.activeTab !== 'MANAGER_SERVICE') {
      list = list.filter((u) => u.role === this.activeTab);
    }

    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }

    // Latest first
    list.sort(
      (a, b) =>
        new Date(b.createdAt ?? '').getTime() -
        new Date(a.createdAt ?? '').getTime(),
    );

    this.filtered = list;
  }

  setTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
    this.applyFilter();
  }
  onSearch(e: Event): void {
    this.searchText = (e.target as HTMLInputElement).value;
    this.applyFilter();
  }

  countByRole(role: string): number {
    return this.users.filter((u) => u.role === role).length;
  }

  // ── Manager Service ────────────────────────────────────────────────────────

  buildManagerCards(): void {
    const managers = this.users.filter((u) => u.role === 'MANAGER');
    const allStaff = this.users.filter((u) => u.role === 'STAFF');

    this.managerCards = managers.map((mgr) => {
      const warehouse = this.warehouses.find((w) => w.id === mgr.warehouseId);
      const staff = allStaff.filter((s) => s.warehouseId === mgr.warehouseId);
      return { manager: mgr, warehouse, staff, staffExpanded: false };
    });
  }

  toggleManagerStaff(card: ManagerCard): void {
    card.staffExpanded = !card.staffExpanded;
  }

  openManagerDetail(card: ManagerCard): void {
    this.selectedManagerCard = card;
    this.showManagerDetail = true;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  openCreate(role: 'MANAGER' | 'STAFF'): void {
    this.createRole = role;
    this.createForm.reset();

    if (role === 'STAFF') {
      this.createForm.get('warehouseId')?.setValidators([Validators.required]);
    } else {
      this.createForm.get('warehouseId')?.clearValidators();
    }
    this.createForm.get('warehouseId')?.updateValueAndValidity();
    this.showCreateModal = true;
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.createLoading = true;
    const obs =
      this.createRole === 'MANAGER'
        ? this.userSvc.createManager(this.createForm.value)
        : this.userSvc.createStaffByAdmin(this.createForm.value);
    obs.subscribe({
      next: () => {
        this.toastr.success(`${this.createRole} account created successfully!`);
        this.showCreateModal = false;
        this.createLoading = false;
        this.load();
      },
      error: () => {
        this.createLoading = false;
      },
    });
  }

  // ── Toggle Status ─────────────────────────────────────────────────────────

  toggleStatus(user: UserResponse): void {
    this.togglingUserId = user.id;
    const obs =
      user.status === 'ACTIVE'
        ? this.userSvc.deactivateUser(user.id)
        : this.userSvc.activateUser(user.id);

    obs.subscribe({
      next: () => {
        const newStatus =
          user.status === 'ACTIVE' ? 'deactivated' : 'activated';
        this.toastr.success(`${user.name} has been ${newStatus}.`);
        this.togglingUserId = null;
        this.load();
      },
      error: () => {
        this.togglingUserId = null;
      },
    });
  }

  isToggling(userId: number): boolean {
    return this.togglingUserId === userId;
  }

  getRoleColor(role: string): string {
    const m: Record<string, string> = {
      ADMIN: '#ef4444',
      MANAGER: '#6366f1',
      STAFF: '#10b981',
      SUPPLIER: '#f59e0b',
    };
    return m[role] ?? '#6366f1';
  }

  getWarehouseName(warehouseId?: number): string {
    if (!warehouseId) return '—';
    return this.warehouses.find((w) => w.id === warehouseId)?.name ?? '—';
  }
}
