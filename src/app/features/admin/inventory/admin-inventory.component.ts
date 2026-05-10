import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../core/services/inventory.service';
import { InventoryResponse } from '../../../core/models/inventory.model';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-inventory.component.html',
  styleUrls: ['./admin-inventory.component.scss']
})
export class AdminInventoryComponent implements OnInit {
  inventory: InventoryResponse[] = [];
  filtered: InventoryResponse[] = [];
  loading = true;
  showLowStock = false;
  searchText = '';

  constructor(private svc: InventoryService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({ next: r => { this.inventory = r.data; this.applyFilter(); this.loading = false; }, error: () => { this.loading = false; } });
  }

  applyFilter(): void {
    let list = this.inventory;
    if (this.showLowStock) list = list.filter(i => i.isLowStock);
    if (this.searchText) { const q = this.searchText.toLowerCase(); list = list.filter(i => i.productName.toLowerCase().includes(q) || i.warehouseName.toLowerCase().includes(q)); }
    this.filtered = list;
  }

  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }
  toggleLowStock(): void { this.showLowStock = !this.showLowStock; this.applyFilter(); }

  get lowStockCount(): number { return this.inventory.filter(i => i.isLowStock).length; }
}