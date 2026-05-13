import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // roles in route data are plain: ['ADMIN'], ['SUPPLIER'] etc — no ROLE_ prefix
  const allowedRoles: string[] = route.data['roles'] ?? [];
  const userRole = auth.getRole(); // also plain: "ADMIN" etc
  if (userRole && allowedRoles.includes(userRole)) return true;
  router.navigate(['/auth/login']);
  return false;
};