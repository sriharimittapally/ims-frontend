import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';
import { InventoryResponse } from '../../../core/models/inventory.model';
import { ProductResponse } from '../../../core/models/product.model';
import { ProductSupplierResponse } from '../../../core/models/product-supplier.model';

@Component({
  selector: 'app-manager-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-inventory.component.html',
  styleUrls: ['./manager-inventory.component.scss']
})
export class ManagerInventoryComponent implements OnInit {
  inventory: InventoryResponse[] = [];
  filtered: InventoryResponse[] = [];
  productsById = new Map<number, ProductResponse>();
  preferredSavingIds = new Set<number>();
  loading = true;
  searchText = '';
  showLowStock = false;

  constructor(
    private svc: InventoryService,
    private productSvc: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    forkJoin({
      inventory: this.svc.getMyWarehouse(),
      products: this.productSvc.getAll()
    }).subscribe({
      next: ({ inventory, products }) => {
        this.inventory = inventory.data;
        this.productsById = new Map(products.data.map(product => [product.id, product]));
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    let list = this.inventory;
    if (this.showLowStock) list = list.filter(i => i.lowStock);
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(i =>
        i.productName.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.categoryName.toLowerCase().includes(q)
      );
    }
    this.filtered = list;
  }

  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }

  getActiveSupplierLinks(productId: number): ProductSupplierResponse[] {
    return (this.productsById.get(productId)?.suppliers ?? [])
      .filter(link => link.isActive)
      .sort((a, b) => {
        const preferred = Number(b.isPreferred) - Number(a.isPreferred);
        if (preferred !== 0) return preferred;
        const lead = (a.leadTimeDays ?? 9999) - (b.leadTimeDays ?? 9999);
        if (lead !== 0) return lead;
        return Number(a.purchasePrice ?? 0) - Number(b.purchasePrice ?? 0);
      });
  }

  getPreferredSupplierLink(productId: number): ProductSupplierResponse | undefined {
    return this.getActiveSupplierLinks(productId).find(link => link.isPreferred);
  }

  setPreferredSupplier(inv: InventoryResponse, productSupplierId: number | null): void {
    if (!productSupplierId) return;

    this.preferredSavingIds.add(inv.productId);
    this.productSvc.setPreferredSupplier(inv.productId, Number(productSupplierId)).subscribe({
      next: () => {
        const product = this.productsById.get(inv.productId);
        if (product?.suppliers) {
          product.suppliers = product.suppliers.map(link => ({
            ...link,
            isPreferred: link.id === Number(productSupplierId)
          }));
          this.productsById.set(inv.productId, product);
        }
        this.preferredSavingIds.delete(inv.productId);
        this.toastr.success(`Preferred supplier updated for ${inv.productName}.`);
      },
      error: () => {
        this.preferredSavingIds.delete(inv.productId);
      }
    });
  }

  get lowStockCount(): number { return this.inventory.filter(i => i.lowStock).length; }
  get totalUnits(): number { return this.inventory.reduce((sum, i) => sum + i.quantity, 0); }
  get reservedUnits(): number { return this.inventory.reduce((sum, i) => sum + i.reservedQuantity, 0); }
  get availableUnits(): number { return this.inventory.reduce((sum, i) => sum + i.availableQuantity, 0); }
}