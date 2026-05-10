import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError(err => {
      const msg = err.error?.message ?? err.message ?? 'An error occurred';
      switch (err.status) {
        case 401:
          auth.logout();
          toastr.warning('Session expired. Please login again.');
          break;
        case 403:
          toastr.error('You do not have permission to perform this action.');
          break;
        case 404:
          toastr.error('Resource not found.');
          break;
        case 500:
          toastr.error('Server error. Please try again later.');
          break;
        default:
          toastr.error(msg);
      }
      return throwError(() => err);
    })
  );
};