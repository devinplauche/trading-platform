import { HttpErrorResponse } from '@angular/common/http';

export function isBackendUnavailable(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    (error.status === 0 || error.status >= 500)
  );
}