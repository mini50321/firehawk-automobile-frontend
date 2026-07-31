import { Injectable, inject, signal } from '@angular/core';

import { LocalStorage } from '../../../core/services/local-storage';
import {
  CarTableViewState,
  DEFAULT_CAR_TABLE_VIEW_STATE,
} from '../models/car-table-view-state.model';
import { CarFilterCriteria } from '../models/car-filter-criteria.model';

const STORAGE_KEY = 'firehawk-automobile.car-table-view-state';

/** Numbers stored as `null` (an explicit "no bound") vs. genuinely absent both mean "unset" here. */
function isNullableNumber(value: unknown): boolean {
  return value === null || typeof value === 'number';
}

/**
 * Validates the *current* `CarFilterCriteria` shape, not just "is an object" — a browser that
 * still has state persisted from a previous version of this app (a different filter schema) must
 * have that state discarded rather than passed through as-is, since a shape mismatch (e.g. a
 * missing `mpg` field) would otherwise throw deep inside `CarFilters` and take the whole page down
 * with it (see the `mpg.min` crash this was written to fix).
 */
function isValidFilters(value: unknown): value is CarFilterCriteria {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const filters = value as Partial<CarFilterCriteria>;
  return (
    typeof filters.search === 'string' &&
    (filters.origin === null ||
      filters.origin === 'usa' ||
      filters.origin === 'europe' ||
      filters.origin === 'japan') &&
    isNullableNumber(filters.cylinders) &&
    typeof filters.mpg === 'object' &&
    filters.mpg !== null &&
    isNullableNumber(filters.mpg.min) &&
    isNullableNumber(filters.mpg.max)
  );
}

function isValidState(value: unknown): value is CarTableViewState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const state = value as Partial<CarTableViewState>;
  return (
    isValidFilters(state.filters) &&
    typeof state.sortActive === 'string' &&
    (state.sortDirection === 'asc' ||
      state.sortDirection === 'desc' ||
      state.sortDirection === '') &&
    typeof state.pageIndex === 'number' &&
    typeof state.pageSize === 'number'
  );
}

@Injectable({
  providedIn: 'root',
})
export class CarTableViewStateStore {
  private readonly storage = inject(LocalStorage);

  private readonly state = signal<CarTableViewState>(this.restore());

  readonly snapshot = this.state.asReadonly();

  updateFilters(filters: CarFilterCriteria): void {
    this.patch({ filters });
  }

  updateSort(sortActive: string, sortDirection: CarTableViewState['sortDirection']): void {
    this.patch({ sortActive, sortDirection });
  }

  updatePage(pageIndex: number, pageSize: number): void {
    this.patch({ pageIndex, pageSize });
  }

  private patch(partial: Partial<CarTableViewState>): void {
    const next = { ...this.state(), ...partial };
    this.state.set(next);
    this.storage.setItem(STORAGE_KEY, next);
  }

  private restore(): CarTableViewState {
    const stored = this.storage.getItem<unknown>(STORAGE_KEY);
    return isValidState(stored) ? stored : DEFAULT_CAR_TABLE_VIEW_STATE;
  }
}
