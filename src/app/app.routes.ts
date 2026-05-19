import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { supplierApprovedGuard } from './core/guards/supplier-approved.guard';

export const routes: Routes = [
  // Landing page — handles login/register as modals
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },

  // Auth routes — redirect to landing (login/register moved to landing modals)
  { path: 'auth/login',    redirectTo: '/', pathMatch: 'full' },
  { path: 'auth/register', redirectTo: '/', pathMatch: 'full' },
  { path: 'auth',          redirectTo: '/', pathMatch: 'full' },

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: 'dashboard',        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users',            loadComponent: () => import('./features/admin/users/user-management.component').then(m => m.UserManagementComponent) },
      { path: 'managers',         loadComponent: () => import('./features/admin/managers/admin-managers.component').then(m => m.AdminManagersComponent) },
      { path: 'warehouses',       loadComponent: () => import('./features/admin/warehouses/warehouse-management.component').then(m => m.WarehouseManagementComponent) },
      { path: 'categories',       loadComponent: () => import('./features/admin/categories/category-management.component').then(m => m.CategoryManagementComponent) },
      { path: 'products',         loadComponent: () => import('./features/admin/products/product-management.component').then(m => m.ProductManagementComponent) },
      { path: 'inventory',        loadComponent: () => import('./features/admin/inventory/admin-inventory.component').then(m => m.AdminInventoryComponent) },
      { path: 'stock-movements',  loadComponent: () => import('./features/admin/stock-movements/admin-stock-movements.component').then(m => m.AdminStockMovementsComponent) },
      { path: 'suppliers',        loadComponent: () => import('./features/admin/suppliers/supplier-management.component').then(m => m.SupplierManagementComponent) },
      { path: 'purchase-orders',  loadComponent: () => import('./features/admin/purchase-orders/admin-po.component').then(m => m.AdminPoComponent) },
      { path: 'reports',          loadComponent: () => import('./features/admin/reports/admin-reports.component').then(m => m.AdminReportsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── MANAGER ─────────────────────────────────────────────────────────────────
  {
    path: 'manager',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    children: [
      { path: 'dashboard',        loadComponent: () => import('./features/manager/dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent) },
      { path: 'staff',            loadComponent: () => import('./features/manager/staff/manager-staff.component').then(m => m.ManagerStaffComponent) },
      { path: 'purchase-orders',  loadComponent: () => import('./features/manager/purchase-orders/manager-po.component').then(m => m.ManagerPoComponent) },
      { path: 'stock-issues',     loadComponent: () => import('./features/manager/stock-issues/manager-stock-issues.component').then(m => m.ManagerStockIssuesComponent) },
      { path: 'inventory',        loadComponent: () => import('./features/manager/inventory/manager-inventory.component').then(m => m.ManagerInventoryComponent) },
      { path: 'stock-movements',  loadComponent: () => import('./features/manager/stock-movements/manager-stock-movements.component').then(m => m.ManagerStockMovementsComponent) },
      { path: 'reports',          loadComponent: () => import('./features/manager/reports/manager-reports.component').then(m => m.ManagerReportsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── STAFF ────────────────────────────────────────────────────────────────────
  {
    path: 'staff',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['STAFF'] },
    children: [
      { path: 'dashboard',        loadComponent: () => import('./features/staff/dashboard/staff-dashboard.component').then(m => m.StaffDashboardComponent) },
      { path: 'purchase-orders',  loadComponent: () => import('./features/staff/purchase-orders/staff-po.component').then(m => m.StaffPoComponent) },
      { path: 'stock-issues',     loadComponent: () => import('./features/staff/stock-issues/staff-stock-issues.component').then(m => m.StaffStockIssuesComponent) },
      { path: 'inventory',        loadComponent: () => import('./features/staff/inventory/staff-inventory.component').then(m => m.StaffInventoryComponent) },
      { path: 'reports',          loadComponent: () => import('./features/staff/reports/staff-reports.component').then(m => m.StaffReportsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── SUPPLIER ─────────────────────────────────────────────────────────────────
  {
    path: 'supplier',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SUPPLIER'] },
    children: [
      { path: 'status',           loadComponent: () => import('./features/supplier/status/supplier-status.component').then(m => m.SupplierStatusComponent) },
      { path: 'dashboard',        canActivate: [supplierApprovedGuard], loadComponent: () => import('./features/supplier/dashboard/supplier-dashboard.component').then(m => m.SupplierDashboardComponent) },
      { path: 'profile',          canActivate: [supplierApprovedGuard], loadComponent: () => import('./features/supplier/profile/supplier-profile.component').then(m => m.SupplierProfileComponent) },
      { path: 'my-products',      canActivate: [supplierApprovedGuard], loadComponent: () => import('./features/supplier/my-products/supplier-my-products.component').then(m => m.SupplierMyProductsComponent) },
      { path: 'purchase-orders',  canActivate: [supplierApprovedGuard], loadComponent: () => import('./features/supplier/purchase-orders/supplier-po.component').then(m => m.SupplierPoComponent) },
      { path: 'reports',          canActivate: [supplierApprovedGuard], loadComponent: () => import('./features/supplier/reports/supplier-reports.component').then(m => m.SupplierReportsComponent) },
      { path: '', redirectTo: 'status', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '/' }
];