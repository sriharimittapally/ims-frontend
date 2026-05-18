import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';

const FRIENDLY_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'The server could not process your request. Please review the data.',
  500: 'Something went wrong on our end. Please try again in a moment.',
  502: 'Service temporarily unavailable. Please try again shortly.',
  503: 'The server is currently busy. Please try again later.'
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr  = inject(ToastrService);
  const auth    = inject(AuthService);

  return next(req).pipe(
    catchError(err => {
      // Use backend message when available and meaningful
      const backendMsg: string | undefined = err.error?.message;

      // For 401, force logout
      if (err.status === 401) {
        auth.logout();
        toastr.warning(
          'Your session has expired. Please sign in again.',
          'Session Expired',
          { timeOut: 4000 }
        );
        return throwError(() => err);
      }

      // Compose user-friendly message
      const friendly = FRIENDLY_MESSAGES[err.status];
      const message  = backendMsg || friendly || 'An unexpected error occurred. Please try again.';

      // Determine title from status
      const titles: Record<number, string> = {
        400: 'Invalid Request',
        403: 'Access Denied',
        404: 'Not Found',
        409: 'Conflict',
        422: 'Validation Error',
        500: 'Server Error',
        502: 'Service Unavailable',
        503: 'Service Busy'
      };
      const title = titles[err.status] ?? 'Error';

      // Don't show error toast for specific endpoints (like profile check)
      const silentUrls = ['/suppliers/profile', '/auth/login'];
      const isSilent   = silentUrls.some(url => req.url.includes(url));

      if (!isSilent || err.status !== 404) {
        toastr.error(message, title, { timeOut: 4500 });
      }

      return throwError(() => err);
    })
  );
};