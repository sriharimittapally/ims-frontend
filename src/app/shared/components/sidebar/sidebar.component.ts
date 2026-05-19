import { Component, Input, computed, signal, Output, EventEmitter, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SupplierService } from '../../../core/services/supplier.service';

interface NavItem { label: string; icon: string; route: string; badge?: string; }
interface NavSection { label?: string; items: NavItem[]; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() mobileClose = new EventEmitter<void>();

  supplierApproved = signal(false);
  showProfilePopup = false;

  constructor(public auth: AuthService, private supSvc: SupplierService, private router: Router) {
    if (auth.getRole() === 'SUPPLIER') {
      this.supSvc.getMyProfile().subscribe({
        next: r => this.supplierApproved.set(r.data.approvalStatus === 'APPROVED'),
        error: () => this.supplierApproved.set(false)
      });
    }
  }

  closeMobile(): void { this.mobileClose.emit(); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.sidebar-profile-area')) this.showProfilePopup = false;
  }

  navSections = computed<NavSection[]>(() => {
    const role = this.auth.getRole();
    switch (role) {
      case 'ADMIN': return [
        { label: 'OVERVIEW', items: [
          { label: 'Dashboard', icon: 'bi-speedometer2', route: '/admin/dashboard' }
        ]},
        { label: 'PEOPLE', items: [
          { label: 'All Users',    icon: 'bi-people',        route: '/admin/users' },
          { label: 'Managers',     icon: 'bi-person-badge',  route: '/admin/managers' }
        ]},
        { label: 'CATALOGUE', items: [
          { label: 'Warehouses',   icon: 'bi-building',      route: '/admin/warehouses' },
          { label: 'Categories',   icon: 'bi-tags',          route: '/admin/categories' },
          { label: 'Products',     icon: 'bi-box-seam',      route: '/admin/products' }
        ]},
        { label: 'INVENTORY', items: [
          { label: 'Inventory',        icon: 'bi-archive',          route: '/admin/inventory' },
          { label: 'Stock Movements',  icon: 'bi-arrow-left-right', route: '/admin/stock-movements' }
        ]},
        { label: 'PROCUREMENT', items: [
          { label: 'Suppliers',       icon: 'bi-truck',       route: '/admin/suppliers' },
          { label: 'Purchase Orders', icon: 'bi-cart-check',  route: '/admin/purchase-orders' }
        ]},
        { label: 'INSIGHTS', items: [
          { label: 'Reports', icon: 'bi-bar-chart-line', route: '/admin/reports' }
        ]}
      ];

      case 'MANAGER': return [
        { label: 'OVERVIEW', items: [{ label: 'Dashboard', icon: 'bi-speedometer2', route: '/manager/dashboard' }]},
        { label: 'MY WAREHOUSE', items: [
          { label: 'Inventory',       icon: 'bi-archive',          route: '/manager/inventory' },
          { label: 'Stock Movements', icon: 'bi-arrow-left-right', route: '/manager/stock-movements' }
        ]},
        { label: 'OPERATIONS', items: [
          { label: 'Purchase Orders', icon: 'bi-cart-check',     route: '/manager/purchase-orders' },
          { label: 'Stock Issues',    icon: 'bi-clipboard-check', route: '/manager/stock-issues' }
        ]},
        { label: 'TEAM', items: [{ label: 'My Staff', icon: 'bi-person-badge', route: '/manager/staff' }]},
        { label: 'INSIGHTS', items: [{ label: 'Reports', icon: 'bi-bar-chart-line', route: '/manager/reports' }]}
      ];

      case 'STAFF': return [
        { label: 'OVERVIEW', items: [{ label: 'Dashboard', icon: 'bi-speedometer2', route: '/staff/dashboard' }]},
        { label: 'OPERATIONS', items: [
          { label: 'Stock Issues',    icon: 'bi-clipboard-check', route: '/staff/stock-issues' },
          { label: 'Purchase Orders', icon: 'bi-cart-check',      route: '/staff/purchase-orders' }
        ]},
        { label: 'WAREHOUSE', items: [{ label: 'Inventory', icon: 'bi-archive', route: '/staff/inventory' }]},
        { label: 'INSIGHTS', items: [{ label: 'Reports', icon: 'bi-bar-chart-line', route: '/staff/reports' }]}
      ];

      case 'SUPPLIER':
        if (this.supplierApproved()) {
          return [
            { label: 'OVERVIEW', items: [{ label: 'Dashboard', icon: 'bi-speedometer2', route: '/supplier/dashboard' }]},
            { label: 'MY BUSINESS', items: [
              { label: 'My Profile',      icon: 'bi-person-circle',  route: '/supplier/profile' },
              { label: 'My Products',     icon: 'bi-box-seam',       route: '/supplier/my-products' },
              { label: 'Purchase Orders', icon: 'bi-cart-check',     route: '/supplier/purchase-orders' }
            ]},
            { label: 'INSIGHTS', items: [{ label: 'Reports', icon: 'bi-bar-chart-line', route: '/supplier/reports' }]}
          ];
        }
        return [{ items: [{ label: 'Account Status', icon: 'bi-shield-check', route: '/supplier/status' }] }];

      default: return [];
    }
  });

  getPortalLabel(): string {
    const m: Record<string,string> = {
      ADMIN:'Admin Portal', MANAGER:'Manager Portal', STAFF:'Staff Portal', SUPPLIER:'Supplier Portal'
    };
    return m[this.auth.getRole() ?? ''] ?? 'IMS Portal';
  }

  getRoleGradient(): string {
    const m: Record<string,string> = {
      ADMIN: 'linear-gradient(135deg,#ef4444,#dc2626)',
      MANAGER: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      STAFF: 'linear-gradient(135deg,#10b981,#059669)',
      SUPPLIER: 'linear-gradient(135deg,#f59e0b,#d97706)'
    };
    return m[this.auth.getRole() ?? ''] ?? 'linear-gradient(135deg,#6366f1,#8b5cf6)';
  }

  getRoleBadgeColor(): string {
    const m: Record<string,string> = {
      ADMIN:'#ef4444', MANAGER:'#6366f1', STAFF:'#10b981', SUPPLIER:'#f59e0b'
    };
    return m[this.auth.getRole() ?? ''] ?? '#6366f1';
  }

  logout(): void { this.auth.logout(); }
}