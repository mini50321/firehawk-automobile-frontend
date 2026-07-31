import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'firehawk-automobile.admin-key';

/**
 * Holds the shared admin key needed to add a new automobile (there's no user-account system in
 * this app). Kept in `sessionStorage`, not `localStorage`: it should survive the accidental
 * tab/browser closes John does during the day, but not linger indefinitely the way filter state
 * intentionally does — closing the browser fully clears it, requiring re-entry.
 */
@Injectable({
  providedIn: 'root',
})
export class AdminAuth {
  private readonly key = signal<string | null>(sessionStorage.getItem(STORAGE_KEY));

  readonly hasKey = computed(() => this.key() !== null);

  getKey(): string | null {
    return this.key();
  }

  setKey(value: string): void {
    sessionStorage.setItem(STORAGE_KEY, value);
    this.key.set(value);
  }

  /** Called when the backend rejects the stored key (401), so the user is prompted again. */
  clearKey(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.key.set(null);
  }
}
