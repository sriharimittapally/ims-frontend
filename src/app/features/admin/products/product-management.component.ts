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
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ProductResponse } from '../../../core/models/product.model';
import { CategoryResponse } from '../../../core/models/category.model';
import { SupplierProfileResponse } from '../../../core/models/supplier.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss'],
})
export class ProductManagementComponent implements OnInit {
  products: ProductResponse[] = [];
  filtered: ProductResponse[] = [];
  categories: CategoryResponse[] = [];
  suppliers: SupplierProfileResponse[] = [];
  loading = true;
  searchText = '';
  selectedCategory = '';

  showModal = false;
  editMode = false;
  editId: number | null = null;
  submitLoading = false;

  showLinkModal = false;
  linkProductId: number | null = null;
  linkForm: FormGroup;

  form: FormGroup;

  constructor(
    private pSvc: ProductService,
    private cSvc: CategoryService,
    private sSvc: SupplierService,
    private modal: NgbModal,
    private toastr: ToastrService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      productName: ['', Validators.required],
      description: ['', Validators.required],
      sku: ['', Validators.required],
      sellingPrice: [0, [Validators.required, Validators.min(0.01)]],
      unit: ['', Validators.required],
      reorderLevel: [0, Validators.required],
      categoryId: ['', Validators.required],
    });
    this.linkForm = this.fb.group({
      supplierId: ['', Validators.required],
      unitCost: [0, [Validators.required, Validators.min(0.01)]],
      isPreferred: [false],
    });
  }

  ngOnInit(): void {
    this.load();
    this.cSvc
      .getAll()
      .subscribe(
        (r) => (this.categories = r.data.filter((c) => c.status === 'ACTIVE')),
      );
    this.sSvc
      .getAll()
      .subscribe(
        (r) =>
          (this.suppliers = r.data.filter(
            (s) => s.approvalStatus === 'APPROVED',
          )),
      );
  }

  load(): void {
    this.loading = true;
    this.pSvc.getAll().subscribe({
      next: (r) => {
        this.products = r.data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    let list = this.products;
    if (this.selectedCategory)
      list = list.filter((p) => p.category.id === +this.selectedCategory);
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(
        (p) =>
          p.category.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      );
    }
    this.filtered = list;
  }

  onSearch(e: Event): void {
    this.searchText = (e.target as HTMLInputElement).value;
    this.applyFilter();
  }
  onCatFilter(e: Event): void {
    this.selectedCategory = (e.target as HTMLSelectElement).value;
    this.applyFilter();
  }

  openCreate(): void {
    this.editMode = false;
    this.editId = null;
    this.form.reset({ unitPrice: 0, reorderLevel: 0 });
    this.showModal = true;
  }
  openEdit(p: ProductResponse): void {
    this.editMode = true;
    this.editId = p.category.id;
    this.form.patchValue(p);
    this.showModal = true;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitLoading = true;
    const obs = this.editMode
      ? this.pSvc.update(this.editId!, this.form.value)
      : this.pSvc.create(this.form.value);
    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.editMode ? 'Product updated' : 'Product created',
        );
        this.showModal = false;
        this.submitLoading = false;
        this.load();
      },
      error: () => {
        this.submitLoading = false;
      },
    });
  }

  toggle(p: ProductResponse): void {
    const action = p.status === 'ACTIVE' ? 'deactivate' : 'activate';
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = `${action} Product`;
    ref.componentInstance.message = `${action} <strong>${p.category.name}</strong>?`;
    ref.componentInstance.confirmClass =
      action === 'deactivate' ? 'danger' : 'success';
    ref.componentInstance.confirmLabel =
      action.charAt(0).toUpperCase() + action.slice(1);
    ref.result
      .then(() => {
        const obs =
          p.status === 'ACTIVE'
            ? this.pSvc.deactivate(p.id)
            : this.pSvc.activate(p.id);
        obs.subscribe({
          next: () => {
            this.toastr.success(`Product ${action}d`);
            this.load();
          },
        });
      })
      .catch(() => {});
  }

  openLink(p: ProductResponse): void {
    this.linkProductId = p.id;
    this.linkForm.reset({ isPreferred: false, unitCost: 0 });
    this.showLinkModal = true;
  }

  submitLink(): void {
    if (this.linkForm.invalid) {
      this.linkForm.markAllAsTouched();
      return;
    }
    this.pSvc.linkSupplier(this.linkProductId!, this.linkForm.value).subscribe({
      next: () => {
        this.toastr.success('Supplier linked');
        this.showLinkModal = false;
        this.load();
      },
    });
  }
}
