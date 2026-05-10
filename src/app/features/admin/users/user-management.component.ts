import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../core/models/user.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: UserResponse[] = [];
  filtered: UserResponse[] = [];
  loading = true;
  searchText = '';
  selectedRole = '';
  activeTab: 'ALL' | 'MANAGER' | 'STAFF' | 'SUPPLIER' = 'ALL';

  createForm: FormGroup;
  createRole: 'MANAGER' | 'STAFF' = 'MANAGER';
  createLoading = false;
  showCreateModal = false;

  constructor(
    private userSvc: UserService,
    private modal: NgbModal,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      name:     ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.userSvc.getAllUsers().subscribe({
      next: res => { this.users = res.data; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    let list = this.users;
    if (this.activeTab !== 'ALL') list = list.filter(u => u.role === this.activeTab);
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    this.filtered = list;
  }

  setTab(tab: 'ALL'|'MANAGER'|'STAFF'|'SUPPLIER'): void { this.activeTab = tab; this.applyFilter(); }

  onSearch(ev: Event): void { this.searchText = (ev.target as HTMLInputElement).value; this.applyFilter(); }

  openCreate(role: 'MANAGER'|'STAFF'): void {
    this.createRole = role;
    this.createForm.reset();
    this.showCreateModal = true;
  }

  submitCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.createLoading = true;
    const obs = this.createRole === 'MANAGER'
      ? this.userSvc.createManager(this.createForm.value)
      : this.userSvc.createStaffByAdmin(this.createForm.value);
    obs.subscribe({
      next: () => {
        this.toastr.success(`${this.createRole} created successfully`);
        this.showCreateModal = false;
        this.createLoading = false;
        this.load();
      },
      error: () => { this.createLoading = false; }
    });
  }

  toggleStatus(user: UserResponse): void {
    const action = user.status === 'ACTIVE' ? 'deactivate' : 'activate';
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = action === 'deactivate' ? 'Deactivate User' : 'Activate User';
    ref.componentInstance.message = `Are you sure you want to <strong>${action}</strong> <strong>${user.name}</strong>?`;
    ref.componentInstance.icon = action === 'deactivate' ? 'bi-slash-circle' : 'bi-check-circle';
    ref.componentInstance.iconColor = action === 'deactivate' ? 'var(--ims-danger)' : 'var(--ims-success)';
    ref.componentInstance.confirmLabel = action === 'deactivate' ? 'Deactivate' : 'Activate';
    ref.componentInstance.confirmClass = action === 'deactivate' ? 'danger' : 'success';
    ref.result.then(() => {
      const obs = user.status === 'ACTIVE'
        ? this.userSvc.deactivateUser(user.id)
        : this.userSvc.activateUser(user.id);
      obs.subscribe({ next: () => { this.toastr.success(`User ${action}d`); this.load(); } });
    }).catch(() => {});
  }

  countByRole(role: string): number {
    return this.users.filter(u => u.role === role).length;
  }
}