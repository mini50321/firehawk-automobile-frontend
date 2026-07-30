import { SortDirection } from '@angular/material/sort';

import { CarFilterCriteria, EMPTY_CAR_FILTER_CRITERIA } from './car-filter-criteria.model';

export interface CarTableViewState {
  filters: CarFilterCriteria;
  sortActive: string;
  sortDirection: SortDirection;
  pageIndex: number;
  pageSize: number;
}

export const DEFAULT_CAR_TABLE_VIEW_STATE: CarTableViewState = {
  filters: EMPTY_CAR_FILTER_CRITERIA,
  sortActive: '',
  sortDirection: '',
  pageIndex: 0,
  pageSize: 10,
};
