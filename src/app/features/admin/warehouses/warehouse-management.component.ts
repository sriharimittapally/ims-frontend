import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { UserService } from '../../../core/services/user.service';
import { WarehouseResponse } from '../../../core/models/warehouse.model';
import { UserResponse } from '../../../core/models/user.model';

@Component({
  selector: 'app-warehouse-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './warehouse-management.component.html',
  styleUrls: ['./warehouse-management.component.scss']
})
export class WarehouseManagementComponent implements OnInit {
  warehouses: WarehouseResponse[] = [];
  filtered: WarehouseResponse[] = [];
  managers: UserResponse[] = [];
  loading = true;
  searchText = '';
  filterStatus = '';

  showModal = false;
  editMode = false;
  editId: number | null = null;
  submitLoading = false;
  form: FormGroup;

  // Selected warehouse for detail panel
  selectedWarehouse: WarehouseResponse | null = null;
  showDetail = false;
  assignLoading = false;
  selectedManagerId = '';

  constructor(
    private wSvc: WarehouseService,
    private uSvc: UserService,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name:    ['', Validators.required],
      address: ['', Validators.required],
      city:    ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.load();
    this.uSvc.getUsersByRole('MANAGER').subscribe({ next: r => this.managers = r.data });
  }

  load(): void {
    this.loading = true;
    this.wSvc.getAll().subscribe({
      next: r => { this.warehouses = r.data; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
  let list = this.warehouses;

  if (this.filterStatus) {
    list = list.filter(w => w.status === this.filterStatus);
  }

  if (this.searchText) {
    const q = this.searchText.toLowerCase();
    list = list.filter(
      w =>
        w.name.toLowerCase().includes(q) ||
        w.city?.toLowerCase().includes(q)
    );
  }

  // Latest to oldest
  list.sort(
    (a, b) =>
      new Date(b.createdAt || '1970-01-01').getTime() -
      new Date(a.createdAt || '1970-01-01').getTime()
  );

  this.filtered = list;
}

  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }

  openCreate(): void { this.editMode = false; this.editId = null; this.form.reset(); this.showModal = true; }

  openEdit(w: WarehouseResponse): void {
    this.editMode = true; this.editId = w.id;
    this.form.patchValue({ name: w.name, address: w.address, city: w.city });
    this.showModal = true;
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitLoading = true;
    const obs = this.editMode ? this.wSvc.update(this.editId!, this.form.value) : this.wSvc.create(this.form.value);
    obs.subscribe({
      next: () => {
        this.toastr.success(this.editMode ? 'Warehouse updated' : 'Warehouse created');
        this.showModal = false; this.submitLoading = false; this.load();
      },
      error: () => { this.submitLoading = false; }
    });
  }

  toggle(w: WarehouseResponse): void {
    const obs = w.status === 'ACTIVE' ? this.wSvc.deactivate(w.id) : this.wSvc.activate(w.id);
    obs.subscribe({ next: () => { this.toastr.success(`Warehouse ${w.status === 'ACTIVE' ? 'deactivated' : 'activated'}`); this.load(); } });
  }

  openDetail(w: WarehouseResponse): void {
    this.selectedWarehouse = w;
    this.selectedManagerId = w.managerId?.toString() ?? '';
    this.showDetail = true;
  }

  assignManager(): void {
    if (!this.selectedWarehouse || !this.selectedManagerId) return;
    this.assignLoading = true;
    this.uSvc.assignManagerToWarehouse(this.selectedWarehouse.id, +this.selectedManagerId).subscribe({
      next: () => {
        this.toastr.success('Manager assigned successfully');
        this.assignLoading = false;
        this.showDetail = false;
        this.load();
      },
      error: () => { this.assignLoading = false; }
    });
  }

  get activeCount(): number { return this.warehouses.filter(w => w.status === 'ACTIVE').length; }
}