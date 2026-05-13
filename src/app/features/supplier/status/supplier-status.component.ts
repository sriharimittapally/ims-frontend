import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  FormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SupplierService } from '../../../core/services/supplier.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { SupplierProfileResponse } from '../../../core/models/supplier.model';
import { CategoryResponse } from '../../../core/models/category.model';

type PageState = 'loading' | 'no-profile' | 'pending' | 'rejected' | 'approved';

@Component({
  selector: 'app-supplier-status',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './supplier-status.component.html',
  styleUrls: ['./supplier-status.component.scss'],
})
export class SupplierStatusComponent implements OnInit {
  state = signal<PageState>('loading');
  profile: SupplierProfileResponse | null = null;
  categories: CategoryResponse[] = [];
  selectedCategoryIds: number[] = [];
  searchText = '';
  submitLoading = false;

  form: FormGroup;

  // GST pattern from backend
  readonly GST_PATTERN =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  constructor(
    private supSvc: SupplierService,
    private catSvc: CategoryService,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      gstNumber: [
        '',
        [Validators.required, Validators.pattern(this.GST_PATTERN)],
      ],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^[+]?[0-9]{10,15}$/)],
      ],
    });
  }

  ngOnInit(): void {
    this.catSvc.getAll().subscribe((r) => {
      this.categories = r.data.filter((c) => c.status === 'ACTIVE');
    });

    this.loadProfile();
  }

  toggleCategory(id: number): void {

  const idx =
    this.selectedCategoryIds.indexOf(id);

  if (idx === -1) {

    this.selectedCategoryIds.push(id);

  } else {

    this.selectedCategoryIds.splice(idx, 1);

  }

  this.searchText = '';
}

  isCategorySelected(id: number): boolean {
    return this.selectedCategoryIds.includes(id);
  }

  submitProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.selectedCategoryIds.length === 0) {
      this.toastr.warning('Please select at least one product category.');
      return;
    }
    this.submitLoading = true;
    this.supSvc
      .completeProfile({
        ...this.form.value,
        categoryIds: this.selectedCategoryIds,
      })
      .subscribe({
        next: () => {
          this.toastr.success(
            'Profile submitted! Awaiting admin approval.',
            'Profile Complete',
          );

          this.submitLoading = false;

          this.loadProfile();
        },
        error: () => {
          this.submitLoading = false;
        },
      });
  }

  loadProfile(): void {
    this.supSvc.getMyProfile().subscribe({
      next: (r) => {
        this.profile = r.data;

        const status = r.data.approvalStatus;

        if (status === 'APPROVED') {
          this.router.navigate(['/supplier/dashboard']);
        } else if (status === 'PENDING') {
          this.state.set('pending');
        } else if (status === 'REJECTED') {
          this.state.set('rejected');
        }
      },

      error: (err) => {
        if (err.status === 404 || err.status === 400) {
          this.state.set('no-profile');
        } else {
          this.state.set('no-profile');
        }
      },
    });
  }
  get filteredCategories(): CategoryResponse[] {

  if (!this.searchText.trim()) {
    return [];
  }

  const q = this.searchText.toLowerCase();

  return this.categories.filter((c) => {

    const matchesName =
      c.name.toLowerCase().includes(q);

    const matchesDescription =
      (c.description ?? '')
        .toLowerCase()
        .includes(q);

    return (
      !this.isCategorySelected(c.id) &&
      (matchesName || matchesDescription)
    );

  });

}



  get f() {
    return this.form.controls;
  }
}
