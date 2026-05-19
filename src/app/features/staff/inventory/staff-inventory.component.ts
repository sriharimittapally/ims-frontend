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
      <div class="page-header"><h1 class="page-title">Inventory</h1><p class="page-subtitle">Current stock levels in your warehouse (read-only)</p></div>
      <div class="ims-card mb-3"><div class="search-input-wrap"><i class="bi bi-search search-icon"></i><input class="ims-form-control" (input)="onSearch($event)" placeholder="Search product..." style="padding-left:2.25rem"></div></div>
      <div class="page-loader" *ngIf="loading"><div class="spinner-border"></div></div>
      <div class="ims-card p-0 overflow-hidden" *ngIf="!loading">
        <div class="table-responsive">
          <table class="ims-table w-100">
            <thead><tr><th>Product</th><th>SKU</th><th>Available</th><th>Reserved</th><th>Reorder Lvl</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let inv of filtered">
                <td class="fw-600">{{ inv.productName }}</td>
                <td><code style="font-size:.75rem;background:var(--ims-bg-secondary);padding:.1rem .4rem;border-radius:4px">{{ inv.sku }}</code></td>
                <td><span [style.color]="inv.lowStock ? 'var(--ims-danger)' : 'var(--ims-success)'" class="fw-600">{{ inv.availableQuantity | number }}</span></td>
                <td class="text-muted">{{ inv.reservedQuantity }}</td>
                <td class="text-muted">{{ inv.reorderLevel }}</td>
                <td><span class="badge-ims" [ngClass]="inv.lowStock ? 'badge-inactive' : 'badge-active'">{{ inv.lowStock ? 'Low Stock' : 'OK' }}</span></td>
              </tr>
              <tr *ngIf="filtered.length === 0"><td colspan="6"><div class="empty-state"><div class="empty-icon"><i class="bi bi-archive"></i></div><h5>No inventory found</h5></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: ['.fw-600 { font-weight:600; }']
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
    this.filtered = this.inventory.filter(i => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
  }
}