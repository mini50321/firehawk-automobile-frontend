import { Injectable, inject, signal } from '@angular/core';

import { LocalStorage } from '../../../core/services/local-storage';
import {
  CarTableViewState,
  DEFAULT_CAR_TABLE_VIEW_STATE,
} from '../models/car-table-view-state.model';
import { CarFilterCriteria } from '../models/car-filter-criteria.model';

const STORAGE_KEY = 'firehawk-automobile.car-table-view-state';

function isValidState(value: unknown): value is CarTableViewState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const state = value as Partial<CarTableViewState>;
  return (
    typeof state.filters === 'object' &&
    state.filters !== null &&
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
