import { Component, Input, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() collapsed = false;

  constructor(public auth: AuthService, private router: Router) {}

  navItems = computed<NavItem[]>(() => {
    const role = this.auth.getRole();
    switch (role) {
      case 'ADMIN': return [
        { label: 'Dashboard',       icon: 'bi-speedometer2',     route: '/admin/dashboard' },
        { label: 'Users',           icon: 'bi-people',           route: '/admin/users' },
        { label: 'Warehouses',      icon: 'bi-building',         route: '/admin/warehouses' },
        { label: 'Categories',      icon: 'bi-tags',             route: '/admin/categories' },
        { label: 'Products',        icon: 'bi-box-seam',         route: '/admin/products' },
        { label: 'Inventory',       icon: 'bi-archive',          route: '/admin/inventory' },
        { label: 'Suppliers',       icon: 'bi-truck',            route: '/admin/suppliers' },
        { label: 'Purchase Orders', icon: 'bi-cart-check',       route: '/admin/purchase-orders' },
        { label: 'Reports',         icon: 'bi-bar-chart-line',   route: '/admin/reports' }
      ];
      case 'MANAGER': return [
        { label: 'Dashboard',       icon: 'bi-speedometer2',     route: '/manager/dashboard' },
        { label: 'My Staff',        icon: 'bi-person-badge',     route: '/manager/staff' },
        { label: 'Purchase Orders', icon: 'bi-cart-check',       route: '/manager/purchase-orders' },
        { label: 'Stock Issues',    icon: 'bi-arrow-left-right', route: '/manager/stock-issues' },
        { label: 'Inventory',       icon: 'bi-archive',          route: '/manager/inventory' },
        { label: 'Reports',         icon: 'bi-bar-chart-line',   route: '/manager/reports' }
      ];
      case 'STAFF': return [
        { label: 'Dashboard',       icon: 'bi-speedometer2',     route: '/staff/dashboard' },
        { label: 'Purchase Orders', icon: 'bi-cart-check',       route: '/staff/purchase-orders' },
        { label: 'Stock Issues',    icon: 'bi-arrow-left-right', route: '/staff/stock-issues' },
        { label: 'Inventory',       icon: 'bi-archive',          route: '/staff/inventory' },
        { label: 'Reports',         icon: 'bi-bar-chart-line',   route: '/staff/reports' }
      ];
      case 'SUPPLIER': return [
        { label: 'Dashboard',       icon: 'bi-speedometer2',     route: '/supplier/dashboard' },
        { label: 'My Profile',      icon: 'bi-person-circle',    route: '/supplier/profile' },
        { label: 'Purchase Orders', icon: 'bi-cart-check',       route: '/supplier/purchase-orders' },
        { label: 'Reports',         icon: 'bi-bar-chart-line',   route: '/supplier/reports' }
      ];
      default: return [];
    }
  });

  getRoleLabel(): string {
    const role = this.auth.getRole();
    const map: Record<string, string> = {
      ADMIN: 'Administrator', MANAGER: 'Manager',
      STAFF: 'Staff', SUPPLIER: 'Supplier'
    };
    return map[role ?? ''] ?? '';
  }

  getRoleColor(): string {
    const role = this.auth.getRole();
    const map: Record<string, string> = {
      ADMIN: '#ef4444', MANAGER: '#6366f1',
      STAFF: '#10b981', SUPPLIER: '#f59e0b'
    };
    return map[role ?? ''] ?? '#6366f1';
  }

  logout(): void { this.auth.logout(); }
}