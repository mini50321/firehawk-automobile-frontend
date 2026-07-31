import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { Feedback } from '../services/feedback';

/** Shape of every backend error response — see the backend's `errorHandler` middleware. */
interface ApiErrorBody {
  success: false;
  error: { message?: string };
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { success?: unknown }).success === false &&
    typeof (body as { error?: unknown }).error === 'object'
  );
}

function describeError(error: HttpErrorResponse): string {
  // Prefer the backend's own message (e.g. "Automobile not found: abc123", or the 400 explaining
  // why a text search can't be combined with a price range) — it's more specific and actionable
  // than a generic per-status message, and is exactly what the centralized error handler wrote
  // for this exact failure.
  if (isApiErrorBody(error.error) && typeof error.error.error.message === 'string') {
    return error.error.error.message;
  }

  if (error.status === 0) {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  if (error.status === 401 || error.status === 403) {
    return "You don't have permission to do that.";
  }
  if (error.status === 404) {
    return 'The requested resource could not be found.';
  }
  if (error.status >= 500) {
    return 'Something went wrong on our end. Please try again shortly.';
  }
  return 'Something went wrong with that request.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const feedback = inject(Feedback);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        feedback.show(describeError(error));
      }
      return throwError(() => error);
    }),
  );
};
