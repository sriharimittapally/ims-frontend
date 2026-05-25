import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SupplierService } from '../../../core/services/supplier.service';
import { SupplierProfileResponse } from '../../../core/models/supplier.model';

@Component({
  selector: 'app-supplier-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-profile.component.html',
  styleUrls: ['./supplier-profile.component.scss'],
})
export class SupplierProfileComponent implements OnInit {
  profile: SupplierProfileResponse | null = null;
  loading = true;
  editing = false;
  submitLoading = false;
  form: FormGroup;

  constructor(
    private svc: SupplierService,
    private toastr: ToastrService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      companyName: ['', Validators.required],
      gstNumber: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getMyProfile().subscribe({
      next: (r) => {
        this.profile = r.data;
        this.form.patchValue(r.data);
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
    this.svc.completeProfile(this.form.value).subscribe({
      next: () => {
        this.toastr.success('Profile updated');
        this.editing = false;
        this.submitLoading = false;
        this.load();
      },
      error: () => {
        this.submitLoading = false;
      },
    });
  }
}
