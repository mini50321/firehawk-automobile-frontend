import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { Feedback } from '../services/feedback';

function describeError(error: HttpErrorResponse): string {
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
