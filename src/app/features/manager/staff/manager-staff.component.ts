import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../core/models/user.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-manager-staff',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manager-staff.component.html',
  styleUrls: ['./manager-staff.component.scss'],
})
export class ManagerStaffComponent implements OnInit {
  staff: UserResponse[] = [];
  loading = true;
  showModal = false;
  submitLoading = false;
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
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = `${action} Staff`;
    ref.componentInstance.message = `${action} <strong>${s.name}</strong>?`;
    ref.componentInstance.confirmClass =
      action === 'deactivate' ? 'danger' : 'success';
    ref.componentInstance.confirmLabel =
      action.charAt(0).toUpperCase() + action.slice(1);
    ref.result
      .then(() => {
        const obs =
          s.status === 'ACTIVE'
            ? this.svc.deactivateStaff(s.id)
            : this.svc.activateStaff(s.id);
        obs.subscribe({
          next: () => {
            this.toastr.success(`Staff ${action}d`);
            this.load();
          },
        });
      })
      .catch(() => {});
  }
}
