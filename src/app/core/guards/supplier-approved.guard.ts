import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupplierService } from '../services/supplier.service';
import { map, catchError, of } from 'rxjs';

export const supplierApprovedGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const supSvc = inject(SupplierService);
  const router = inject(Router);

  // Only SUPPLIER role hits this guard
  if (auth.getRole() !== 'SUPPLIER') return true;

  return supSvc.getMyProfile().pipe(
    map(res => {
      if (res.data.approvalStatus === 'APPROVED') return true;
      // Redirect to supplier profile regardless of status
      router.navigate(['/supplier/status']);
      return false;
    }),
    catchError(() => {
      // No profile yet — redirect to complete profile
      router.navigate(['/supplier/status']);
      return of(false);
    })
  );
};