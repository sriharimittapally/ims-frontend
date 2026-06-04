import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../core/services/inventory.service';
import { InventoryResponse } from '../../../core/models/inventory.model';

@Component({
  selector: 'app-staff-inventory',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in-up">
      <div class="page-header d-flex align-items-start justify-content-between flex-wrap gap-3">
        <div>
          <h1 class="page-title">Inventory</h1>
          <p class="page-subtitle">Current stock levels in your warehouse. Reserved stock is held by submitted or approved stock issues.</p>
        </div>
        <div class="inv-summary" *ngIf="!loading">
          <span><strong>{{ totalOnHand | number }}</strong> total</span>
          <span><strong>{{ totalReserved | number }}</strong> reserved</span>
          <span><strong>{{ totalAvailable | number }}</strong> available</span>
        </div>
      </div>
      <div class="ims-card mb-3">
        <div class="search-input-wrap inv-search">
          <i class="bi bi-search search-icon"></i>
          <input class="ims-form-control" (input)="onSearch($event)" placeholder="Search product, SKU, category..." style="padding-left:2.25rem">
        </div>
      </div>
      <div class="page-loader" *ngIf="loading"><div class="spinner-border"></div></div>
      <div class="ims-card p-0 overflow-hidden" *ngIf="!loading">
        <div class="table-responsive">
          <table class="ims-table w-100">
            <thead><tr><th>Product</th><th>SKU</th><th>Total</th><th>Reserved</th><th>Available</th><th>Reorder</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let inv of filtered">
                <td>
                  <div class="inv-product">
                    <span>{{ inv.productName }}</span>
                    <small>{{ inv.categoryName }}</small>
                  </div>
                </td>
                <td><code style="font-size:.75rem;background:var(--ims-bg-secondary);padding:.1rem .4rem;border-radius:4px">{{ inv.sku }}</code></td>
                <td class="qty total">{{ inv.quantity | number }}</td>
                <td class="qty reserved">{{ inv.reservedQuantity | number }}</td>
                <td class="qty" [class.low]="inv.lowStock">{{ inv.availableQuantity | number }}</td>
                <td class="qty muted">{{ inv.reorderLevel | number }}</td>
                <td><span class="stock-status" [ngClass]="getStockClass(inv)">{{ getStockLabel(inv) }}</span></td>
              </tr>
              <tr *ngIf="filtered.length === 0"><td colspan="7"><div class="empty-state"><div class="empty-icon"><i class="bi bi-archive"></i></div><h5>No inventory found</h5></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inv-summary { display:flex; gap:.5rem; flex-wrap:wrap; }
    .inv-summary span { display:inline-flex; gap:.25rem; align-items:center; padding:.4rem .7rem; border:1px solid var(--ims-border); border-radius:8px; background:var(--ims-bg-secondary); color:var(--ims-text-secondary); font-size:.78rem; font-weight:700; }
    .inv-search { max-width:420px; }
    .inv-product { display:flex; flex-direction:column; gap:.12rem; font-weight:800; color:var(--ims-text-primary); }
    .inv-product small { color:var(--ims-text-muted); font-size:.72rem; font-weight:600; }
    .qty { font-weight:800; color:var(--ims-success); }
    .qty.total { color:var(--ims-text-primary); }
    .qty.reserved { color:#b45309; }
    .qty.muted { color:var(--ims-text-muted); }
    .qty.low { color:var(--ims-danger); }
    .stock-status { display:inline-flex; align-items:center; min-width:86px; justify-content:center; padding:.24rem .55rem; border-radius:8px; font-size:.72rem; font-weight:800; }
    .stock-status.ok { background:rgba(16,185,129,.12); color:#047857; }
    .stock-status.low { background:rgba(245,158,11,.13); color:#b45309; }
    .stock-status.out { background:rgba(239,68,68,.13); color:#b91c1c; }
  `]
})
export class StaffInventoryComponent implements OnInit {
  inventory: InventoryResponse[] = [];
  filtered: InventoryResponse[] = [];
  loading = true;

  constructor(private svc: InventoryService) {}

  ngOnInit(): void {
    this.svc.getMyWarehouse().subscribe({ next: r => { this.inventory = r.data; this.filtered = r.data; this.loading = false; }, error: () => { this.loading = false; } });
  }

  onSearch(e: Event): void {
    const q = (e.target as HTMLInputElement).value.toLowerCase();
    this.filtered = this.inventory.filter(i =>
      i.productName.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) ||
      i.categoryName.toLowerCase().includes(q)
    );
  }

  get totalOnHand(): number {
    return this.inventory.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalReserved(): number {
    return this.inventory.reduce((sum, item) => sum + item.reservedQuantity, 0);
  }

  get totalAvailable(): number {
    return this.inventory.reduce((sum, item) => sum + item.availableQuantity, 0);
  }

  getStockLabel(inv: InventoryResponse): string {
    if (inv.availableQuantity <= 0) return 'Out';
    return inv.lowStock ? 'Low' : 'OK';
  }

  getStockClass(inv: InventoryResponse): string {
    if (inv.availableQuantity <= 0) return 'out';
    return inv.lowStock ? 'low' : 'ok';
  }
}
