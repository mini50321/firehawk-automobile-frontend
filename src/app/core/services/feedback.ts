import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const DEFAULT_DURATION_MS = 4000;

@Injectable({
  providedIn: 'root',
})
export class Feedback {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.snackBar.open(message, 'Dismiss', { duration: durationMs });
  }
}
