import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login',    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register-supplier/register-supplier.component').then(m => m.RegisterSupplierComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  {
    path: 'admin',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: 'dashboard',       loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users',           loadComponent: () => import('./features/admin/users/user-management.component').then(m => m.UserManagementComponent) },
      { path: 'warehouses',      loadComponent: () => import('./features/admin/warehouses/warehouse-management.component').then(m => m.WarehouseManagementComponent) },
      { path: 'categories',      loadComponent: () => import('./features/admin/categories/category-management.component').then(m => m.CategoryManagementComponent) },
      { path: 'products',        loadComponent: () => import('./features/admin/products/product-management.component').then(m => m.ProductManagementComponent) },
      { path: 'suppliers',       loadComponent: () => import('./features/admin/suppliers/supplier-management.component').then(m => m.SupplierManagementComponent) },
      { path: 'purchase-orders', loadComponent: () => import('./features/admin/purchase-orders/admin-po.component').then(m => m.AdminPoComponent) },
      { path: 'inventory',       loadComponent: () => import('./features/admin/inventory/admin-inventory.component').then(m => m.AdminInventoryComponent) },
      { path: 'reports',         loadComponent: () => import('./features/admin/reports/admin-reports.component').then(m => m.AdminReportsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  {
    path: 'manager',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    children: [
      { path: 'dashboard',       loadComponent: () => import('./features/manager/dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent) },
      { path: 'staff',           loadComponent: () => import('./features/manager/staff/manager-staff.component').then(m => m.ManagerStaffComponent) },
      { path: 'purchase-orders', loadComponent: () => import('./features/manager/purchase-orders/manager-po.component').then(m => m.ManagerPoComponent) },
      { path: 'stock-issues',    loadComponent: () => import('./features/manager/stock-issues/manager-stock-issues.component').then(m => m.ManagerStockIssuesComponent) },
      { path: 'inventory',       loadComponent: () => import('./features/manager/inventory/manager-inventory.component').then(m => m.ManagerInventoryComponent) },
      { path: 'reports',         loadComponent: () => import('./features/manager/reports/manager-reports.component').then(m => m.ManagerReportsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  {
    path: 'staff',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['STAFF'] },
    children: [
      { path: 'dashboard',       loadComponent: () => import('./features/staff/dashboard/staff-dashboard.component').then(m => m.StaffDashboardComponent) },
      { path: 'purchase-orders', loadComponent: () => import('./features/staff/purchase-orders/staff-po.component').then(m => m.StaffPoComponent) },
      { path: 'stock-issues',    loadComponent: () => import('./features/staff/stock-issues/staff-stock-issues.component').then(m => m.StaffStockIssuesComponent) },
      { path: 'inventory',       loadComponent: () => import('./features/staff/inventory/staff-inventory.component').then(m => m.StaffInventoryComponent) },
      { path: 'reports',         loadComponent: () => import('./features/staff/reports/staff-reports.component').then(m => m.StaffReportsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  {
    path: 'supplier',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SUPPLIER'] },
    children: [
      { path: 'dashboard',       loadComponent: () => import('./features/supplier/dashboard/supplier-dashboard.component').then(m => m.SupplierDashboardComponent) },
      { path: 'profile',         loadComponent: () => import('./features/supplier/profile/supplier-profile.component').then(m => m.SupplierProfileComponent) },
      { path: 'purchase-orders', loadComponent: () => import('./features/supplier/purchase-orders/supplier-po.component').then(m => m.SupplierPoComponent) },
      { path: 'reports',         loadComponent: () => import('./features/supplier/reports/supplier-reports.component').then(m => m.SupplierReportsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '/auth/login' }
];