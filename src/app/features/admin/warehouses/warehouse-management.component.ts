import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { UserService } from '../../../core/services/user.service';
import { WarehouseResponse } from '../../../core/models/warehouse.model';
import { UserResponse } from '../../../core/models/user.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-warehouse-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './warehouse-management.component.html',
  styleUrls: ['./warehouse-management.component.scss']
})
export class WarehouseManagementComponent implements OnInit {
  warehouses: WarehouseResponse[] = [];
  managers: UserResponse[] = [];
  loading = true;
  showModal = false;
  editMode = false;
  editId: number | null = null;
  submitLoading = false;

  form: FormGroup;

  constructor(
    private wSvc: WarehouseService,
    private uSvc: UserService,
    private modal: NgbModal,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name:     ['', Validators.required],
      address: ['', Validators.required],
      city:['', Validators.required]
    });
  }

  ngOnInit(): void { this.load(); this.loadManagers(); }

  load(): void {
    this.loading = true;
    this.wSvc.getAll().subscribe({
      next: res => { this.warehouses = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadManagers(): void {
    this.uSvc.getUsersByRole('MANAGER').subscribe(res => this.managers = res.data);
  }

  openCreate(): void { this.editMode = false; this.editId = null; this.form.reset(); this.showModal = true; }

  openEdit(w: WarehouseResponse): void {
    this.editMode = true; this.editId = w.id;
    this.form.patchValue({ name: w.name, location: w.location });
    this.showModal = true;
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitLoading = true;
    const obs = this.editMode
      ? this.wSvc.update(this.editId!, this.form.value)
      : this.wSvc.create(this.form.value);
    obs.subscribe({
      next: () => { this.toastr.success(this.editMode ? 'Warehouse updated' : 'Warehouse created'); this.showModal = false; this.submitLoading = false; this.load(); },
      error: () => { this.submitLoading = false; }
    });
  }

  toggle(w: WarehouseResponse): void {
    const action = w.status === 'ACTIVE' ? 'deactivate' : 'activate';
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = `${action.charAt(0).toUpperCase() + action.slice(1)} Warehouse`;
    ref.componentInstance.message = `${action} <strong>${w.name}</strong>?`;
    ref.componentInstance.confirmClass = action === 'deactivate' ? 'danger' : 'success';
    ref.componentInstance.confirmLabel = action.charAt(0).toUpperCase() + action.slice(1);
    ref.result.then(() => {
      const obs = w.status === 'ACTIVE' ? this.wSvc.deactivate(w.id) : this.wSvc.activate(w.id);
      obs.subscribe({ next: () => { this.toastr.success(`Warehouse ${action}d`); this.load(); } });
    }).catch(() => {});
  }

  assignManager(warehouseId: number, managerId: number): void {
    this.uSvc.assignManagerToWarehouse(warehouseId, managerId).subscribe({
      next: () => { this.toastr.success('Manager assigned'); this.load(); }
    });
  }
}