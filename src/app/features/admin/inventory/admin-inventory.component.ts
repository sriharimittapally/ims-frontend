import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { InventoryResponse } from '../../../core/models/inventory.model';
import { WarehouseResponse } from '../../../core/models/warehouse.model';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-inventory.component.html',
  styleUrls: ['./admin-inventory.component.scss']
})
export class AdminInventoryComponent implements OnInit {
  inventory: InventoryResponse[] = [];
  filtered: InventoryResponse[] = [];
  warehouses: WarehouseResponse[] = [];
  loading = true;
  searchText = '';
  filterWarehouse = '';
  showLowStockOnly = false;

  constructor(private invSvc: InventoryService, private wSvc: WarehouseService) {}

  ngOnInit(): void {
    this.wSvc.getAll().subscribe({ next: r => this.warehouses = r.data });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.invSvc.getAll().subscribe({
      next: r => { this.inventory = r.data; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    let list = this.inventory;
    if (this.showLowStockOnly) list = list.filter(i => i.lowStock);
    if (this.filterWarehouse) list = list.filter(i => i.warehouseId === +this.filterWarehouse);
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(i =>
        i.productName.toLowerCase().includes(q) ||
        i.sku?.toLowerCase().includes(q) ||
        i.warehouseName.toLowerCase().includes(q)
      );
    }
    this.filtered = list;
  }

  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }
  toggleLowStock(): void { this.showLowStockOnly = !this.showLowStockOnly; this.applyFilter(); }

  // FIXED: use lowStock (not isLowStock)
  get lowStockCount(): number { return this.inventory.filter(i => i.lowStock).length; }
  get okCount(): number        { return this.inventory.filter(i => !i.lowStock).length; }
}