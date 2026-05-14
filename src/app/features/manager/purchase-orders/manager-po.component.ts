import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators
} from '@angular/forms';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ProductService } from '../../../core/services/product.service';

import { PurchaseOrderResponse } from '../../../core/models/purchase-order.model';
import { SupplierProfileResponse } from '../../../core/models/supplier.model';
import { ProductResponse } from '../../../core/models/product.model';

import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-manager-po',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manager-po.component.html',
  styleUrls: ['./manager-po.component.scss']
})
export class ManagerPoComponent implements OnInit {

  orders: PurchaseOrderResponse[] = [];

  suppliers: SupplierProfileResponse[] = [];

  products: ProductResponse[] = [];

  loading = true;

  showCreateModal = false;

  submitLoading = false;

  selectedOrder: PurchaseOrderResponse | null = null;

  showDetail = false;

  activeTab = 'ALL';

  form: FormGroup;

  statuses = [
    'ALL',
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'SHIPPED',
    'RECEIVED',
    'CANCELLED',
    'REJECTED'
  ];

  constructor(
    private poSvc: PurchaseOrderService,
    private supSvc: SupplierService,
    private prodSvc: ProductService,
    private modal: NgbModal,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {

    this.form = this.fb.group({

      supplierId: [null, Validators.required],

      note: [''],

      items: this.fb.array([])

    });

  }

  get items(): FormArray {

    return this.form.get('items') as FormArray;

  }

  ngOnInit(): void {

    this.load();

    this.supSvc.getAll().subscribe({

      next: r => {

        this.suppliers =
          r.data.filter(
            s => s.approvalStatus === 'APPROVED'
          );

      }

    });

    this.prodSvc.getAll().subscribe({

      next: r => {

        this.products =
          r.data.filter(
            p => p.status === 'ACTIVE'
          );

      }

    });

  }

  load(): void {

    this.loading = true;

    this.poSvc.getMyWarehousePOs().subscribe({

      next: r => {

        this.orders = r.data;

        this.loading = false;

      },

      error: () => {

        this.loading = false;

      }

    });

  }

  get filtered(): PurchaseOrderResponse[] {

    return this.activeTab === 'ALL'
      ? this.orders
      : this.orders.filter(
          o => o.status === this.activeTab
        );

  }

  openCreate(): void {

    this.items.clear();

    this.form.reset();

    this.addItem();

    this.showCreateModal = true;

  }

  addItem(): void {

    this.items.push(

      this.fb.group({

        productId: [
          null,
          Validators.required
        ],

        quantity: [
          1,
          [
            Validators.required,
            Validators.min(1)
          ]
        ]

      })

    );

  }

  removeItem(index: number): void {

    this.items.removeAt(index);

  }

  getFilteredProducts(): ProductResponse[] {

    const supplierId =
      Number(this.form.value.supplierId);

    if (!supplierId) {

      return [];

    }

    return this.products.filter(product =>

      product.suppliers?.some(

        s => s.supplierId === supplierId

      )

    );

  }

  getPurchasePrice(productId: number): number {

    const supplierId =
      Number(this.form.value.supplierId);

    const product =
      this.products.find(
        p => p.id === Number(productId)
      );

    if (!product) {

      return 0;

    }

    const supplierMapping =
      product.suppliers?.find(
        s => s.supplierId === supplierId
      );

    return Number(
      supplierMapping?.purchasePrice ?? 0
    );

  }

  getLineTotal(item: any): number {

    const productId =
      Number(item.get('productId')?.value);

    const quantity =
      Number(item.get('quantity')?.value || 0);

    const price =
      this.getPurchasePrice(productId);

    return price * quantity;

  }

  submit(): void {

    if (this.form.invalid || this.items.length === 0) {

      this.form.markAllAsTouched();

      return;

    }

  
    this.submitLoading = true;

    const payload = {

      supplierId:
        Number(this.form.value.supplierId),

      note: this.form.value.note,

      items: this.form.value.items.map(
        (item: any) => ({

          productId:
            Number(item.productId),

          quantity:
            Number(item.quantity)

        })
      )

    };

    this.poSvc.create(payload).subscribe({

      next: () => {

        this.toastr.success(
          'Purchase order created successfully'
        );

        this.showCreateModal = false;

        this.submitLoading = false;

        this.load();

      },

      error: err => {

        console.error(err);

        this.submitLoading = false;

        this.toastr.error(
          err?.error?.message ||
          'Failed to create purchase order'
        );

      }

    });

  }

  send(o: PurchaseOrderResponse): void {

    const ref =
      this.modal.open(
        ConfirmModalComponent
      );

    ref.componentInstance.title =
      'Send Purchase Order';

    ref.componentInstance.message =
      `Send <strong>${o.poNumber}</strong> to <strong>${o.supplierName}</strong>?`;

    ref.componentInstance.confirmLabel =
      'Send';

    ref.componentInstance.confirmClass =
      'primary';

    ref.componentInstance.icon =
      'bi-send';

    ref.componentInstance.iconColor =
      'var(--ims-primary)';

    ref.result.then(() => {

      this.poSvc.send(o.id).subscribe({

        next: () => {

          this.toastr.success(
            'PO sent to supplier'
          );

          this.load();

        }

      });

    }).catch(() => {});

  }

  cancel(o: PurchaseOrderResponse): void {

    const ref =
      this.modal.open(
        ConfirmModalComponent
      );

    ref.componentInstance.title =
      'Cancel PO';

    ref.componentInstance.message =
      `Cancel <strong>${o.poNumber}</strong>?`;

    ref.componentInstance.confirmLabel =
      'Cancel PO';

    ref.componentInstance.confirmClass =
      'danger';

    ref.result.then(() => {

      this.poSvc.cancel(o.id).subscribe({

        next: () => {

          this.toastr.success(
            'PO cancelled'
          );

          this.load();

        }

      });

    }).catch(() => {});

  }

  viewDetail(o: PurchaseOrderResponse): void {

    this.selectedOrder = o;

    this.showDetail = true;

  }

  getStatusClass(status: string): string {

    const map: Record<string, string> = {

      DRAFT: 'badge-pending',

      SENT: 'badge-sent',

      ACCEPTED: 'badge-active',

      SHIPPED: 'badge-secondary',

      RECEIVED: 'badge-active',

      CANCELLED: 'badge-inactive',

      REJECTED: 'badge-inactive'

    };

    return map[status] ?? 'badge-pending';

  }

  countBy(status: string): number {

    return this.orders.filter(
      o => o.status === status
    ).length;

  }

}