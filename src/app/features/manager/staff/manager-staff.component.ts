import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../core/models/user.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-manager-staff',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './manager-staff.component.html',
  styleUrls: ['./manager-staff.component.scss'],
})
export class ManagerStaffComponent implements OnInit {
  staff: UserResponse[] = [];
  loading = true;
  showModal = false;
  submitLoading = false;
  searchText = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  selectedStaff: UserResponse | null = null;
  showDetail = false;
  form: FormGroup;

  constructor(
    private svc: UserService,
    private modal: NgbModal,
    private toastr: ToastrService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getMyStaff().subscribe({
      next: (r) => {
        this.staff = r.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get filteredStaff(): UserResponse[] {
    const q = this.searchText.trim().toLowerCase();
    return this.staff
      .filter(s => this.statusFilter === 'ALL' || s.status === this.statusFilter)
      .filter(s => !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.userCode?.toLowerCase().includes(q)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get activeCount(): number {
    return this.staff.filter(s => s.status === 'ACTIVE').length;
  }

  get inactiveCount(): number {
    return this.staff.filter(s => s.status !== 'ACTIVE').length;
  }

  openCreate(): void {
    this.form.reset();
    this.showModal = true;
  }

  openDetail(staff: UserResponse): void {
    this.selectedStaff = staff;
    this.showDetail = true;
  }

  closeDetail(): void {
    this.selectedStaff = null;
    this.showDetail = false;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitLoading = true;
    this.svc.createStaffByManager(this.form.value).subscribe({
      next: () => {
        this.toastr.success('Staff created');
        this.showModal = false;
        this.submitLoading = false;
        this.load();
      },
      error: () => {
        this.submitLoading = false;
      },
    });
  }

  toggle(s: UserResponse): void {
    const action = s.status === 'ACTIVE' ? 'deactivate' : 'activate';
   
      
        const obs =
          s.status === 'ACTIVE'
            ? this.svc.deactivateStaff(s.id)
            : this.svc.activateStaff(s.id);
        obs.subscribe({
          next: () => {
            this.toastr.success(`Staff ${action}d`);
            this.load();
            if (this.selectedStaff?.id === s.id) {
              this.selectedStaff = { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
            }
          },
        });
      }
  
}