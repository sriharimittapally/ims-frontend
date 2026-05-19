import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../core/services/inventory.service';
import { InventoryResponse } from '../../../core/models/inventory.model';

@Component({
  selector: 'app-manager-inventory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-inventory.component.html'
})
export class ManagerInventoryComponent implements OnInit {
  inventory: InventoryResponse[] = [];
  filtered: InventoryResponse[] = [];
  loading = true;
  searchText = '';
  showLowStock = false;

  constructor(private svc: InventoryService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getMyWarehouse().subscribe({ next: r => { this.inventory = r.data; this.applyFilter(); this.loading = false; }, error: () => { this.loading = false; } });
  }

  applyFilter(): void {
    let list = this.inventory;
    if (this.showLowStock) list = list.filter(i => i.lowStock);
    if (this.searchText) { const q = this.searchText.toLowerCase(); list = list.filter(i => i.productName.toLowerCase().includes(q)); }
    this.filtered = list;
  }

  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }
  get lowStockCount(): number { return this.inventory.filter(i => i.lowStock).length; }
}