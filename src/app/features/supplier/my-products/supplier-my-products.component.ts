import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ProductResponse } from '../../../core/models/product.model';
import { ProductSupplierResponse, SupplierLinkRequest } from '../../../core/models/product-supplier.model';
import { CategoryResponse } from '../../../core/models/category.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

type TabView = 'my-linked' | 'browse';

@Component({
  selector: 'app-supplier-my-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './supplier-my-products.component.html',
  styleUrls: ['./supplier-my-products.component.scss']
})
export class SupplierMyProductsComponent implements OnInit {
  activeTab = signal<TabView>('my-linked');

  // My linked products
  myLinkedProducts: ProductResponse[] = [];
  linkedLoading = true;

  // Browse (products in my categories)
  browseProducts: ProductResponse[] = [];
  browseFiltered: ProductResponse[] = [];
  browseLoading = false;
  browseSearchText = '';
  myCategories: CategoryResponse[] = [];
  selectedBrowseCategory = '';

  // Link form
  showLinkModal = false;
  linkingProduct: ProductResponse | null = null;
  linkLoading = false;
  linkForm: FormGroup;

  // Edit link form
  showEditModal = false;
  editingLink: ProductSupplierResponse | null = null;
  editLoading = false;
  editForm: FormGroup;

  // Already-linked product IDs for quick check
  linkedProductIds = new Set<number>();

  constructor(
    private prodSvc: ProductService,
    private supSvc: SupplierService,
    private modal: NgbModal,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {
    this.linkForm = this.fb.group({
      purchasePrice: ['', [Validators.required, Validators.min(0.01)]],
      leadTimeDays:  ['', [Validators.required, Validators.min(1), Validators.max(365)]]
    });
    this.editForm = this.fb.group({
      purchasePrice: ['', [Validators.required, Validators.min(0.01)]],
      leadTimeDays:  ['', [Validators.required, Validators.min(1), Validators.max(365)]]
    });
  }

  ngOnInit(): void {
    this.loadMyLinked();
    // Load categories from supplier profile
    this.supSvc.getMyProfile().subscribe(r => {
      this.myCategories = r.data.categories;
    });
  }

  setTab(tab: TabView): void {
    this.activeTab.set(tab);
    if (tab === 'browse' && this.browseProducts.length === 0) {
      this.loadBrowse();
    }
  }

  loadMyLinked(): void {
    this.linkedLoading = true;
    this.prodSvc.getMyLinkedProducts().subscribe({
      next: r => {
        this.myLinkedProducts = r.data;
        this.linkedProductIds.clear();
        r.data.forEach(p => this.linkedProductIds.add(p.id));
        this.linkedLoading = false;
      },
      error: () => { this.linkedLoading = false; }
    });
  }

  loadBrowse(): void {
    this.browseLoading = true;
    this.prodSvc.getProductsInMyCategories().subscribe({
      next: r => {
        this.browseProducts = r.data;
        this.browseFiltered = r.data;
        this.browseLoading = false;
      },
      error: () => { this.browseLoading = false; }
    });
  }

  onBrowseSearch(e: Event): void {
    this.browseSearchText = (e.target as HTMLInputElement).value.toLowerCase();
    this.filterBrowse();
  }

  onBrowseCategoryFilter(e: Event): void {
    this.selectedBrowseCategory = (e.target as HTMLSelectElement).value;
    this.filterBrowse();
  }

  filterBrowse(): void {
    let list = this.browseProducts;
    if (this.selectedBrowseCategory) {
      list = list.filter(p => p.category.id === +this.selectedBrowseCategory);
    }
    if (this.browseSearchText) {
      list = list.filter(p =>
        p.productName.toLowerCase().includes(this.browseSearchText) ||
        p.sku.toLowerCase().includes(this.browseSearchText)
      );
    }
    this.browseFiltered = list;
  }

  isLinked(productId: number): boolean {
    return this.linkedProductIds.has(productId);
  }

  // Open link modal
  openLinkModal(product: ProductResponse): void {
    this.linkingProduct = product;
    this.linkForm.reset();
    this.showLinkModal = true;
  }

  submitLink(): void {
    if (this.linkForm.invalid) { this.linkForm.markAllAsTouched(); return; }
    if (!this.linkingProduct) return;
    this.linkLoading = true;

    const req: SupplierLinkRequest = {
      purchasePrice: this.linkForm.value.purchasePrice,
      leadTimeDays:  this.linkForm.value.leadTimeDays
    };

    this.prodSvc.linkProduct(this.linkingProduct.id, req).subscribe({
      next: () => {
        this.toastr.success(`You are now supplying "${this.linkingProduct!.productName}"`);
        this.showLinkModal = false;
        this.linkLoading = false;
        this.loadMyLinked();
        // Refresh browse to update button states
        if (this.activeTab() === 'browse') {
          this.loadBrowse();
        }
      },
      error: () => { this.linkLoading = false; }
    });
  }

  // Find my link for a product (from linked products list)
  getMyLinkForProduct(product: ProductResponse): ProductSupplierResponse | null {
    if (!product.suppliers) return null;
    // suppliers on linked products list contains all suppliers
    // we need to find the one where supplierUserCode matches current user
    return product.suppliers.find(s => s.isActive) ?? null;
  }

  // Open edit modal
  openEditModal(product: ProductResponse): void {
    const link = this.getMyLinkForProduct(product);
    if (!link) {
      this.toastr.error('Link details not found'); return;
    }
    this.editingLink = link;
    this.editForm.patchValue({
      purchasePrice: link.purchasePrice,
      leadTimeDays:  link.leadTimeDays
    });
    this.showEditModal = true;
  }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    if (!this.editingLink) return;
    this.editLoading = true;

    const req: SupplierLinkRequest = {
      purchasePrice: this.editForm.value.purchasePrice,
      leadTimeDays:  this.editForm.value.leadTimeDays
    };

    this.prodSvc.updateMyLink(this.editingLink.id, req).subscribe({
      next: () => {
        this.toastr.success('Product link updated successfully');
        this.showEditModal = false;
        this.editLoading = false;
        this.loadMyLinked();
      },
      error: () => { this.editLoading = false; }
    });
  }
}