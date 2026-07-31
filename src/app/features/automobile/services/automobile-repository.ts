import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';

import { Api } from '../../../core/services/api';
import { Car } from '../models/car.model';
import { CarFilterCriteria, EMPTY_CAR_FILTER_CRITERIA } from '../models/car-filter-criteria.model';

export interface CarSort {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedCars {
  data: Car[];
  nextCursor: string | null;
  hasMore: boolean;
}

type QueryParams = Record<string, string | number | boolean>;

const CARS_PATH = '/cars';
const EXPORT_PATH = '/cars/export';

/**
 * Requesting this many rows per page (the backend's own ceiling) keeps round-trips to a minimum
 * for this dataset (~205 rows total, fewer still once filtered) while still genuinely exercising
 * the backend's real cursor-based pagination rather than faking a single unpaginated fetch.
 */
const MAX_PAGE_LIMIT = 100;

function toQueryParams(criteria: CarFilterCriteria, sort: CarSort): QueryParams {
  const params: QueryParams = {};
  const search = criteria.search.trim();

  if (search) params['q'] = search;
  if (criteria.fuelType) params['fuelType'] = criteria.fuelType;
  if (criteria.aspiration) params['aspiration'] = criteria.aspiration;
  if (criteria.bodyStyle) params['bodyStyle'] = criteria.bodyStyle;
  if (criteria.driveWheels) params['driveWheels'] = criteria.driveWheels;
  if (criteria.engineLocation) params['engineLocation'] = criteria.engineLocation;
  if (criteria.price.min !== null) params['minPrice'] = criteria.price.min;
  if (criteria.price.max !== null) params['maxPrice'] = criteria.price.max;
  if (sort.sortBy) params['sortBy'] = sort.sortBy;
  if (sort.sortOrder) params['sortOrder'] = sort.sortOrder;

  return params;
}

@Injectable({
  providedIn: 'root',
})
export class AutomobileRepository {
  private readonly api = inject(Api);

  /**
   * Fetches every car matching the given search/filters/sort from the backend, transparently
   * looping its cursor pagination until exhausted. Filtering and searching happen server-side
   * (query params on `GET /cars`); Material's table then sorts/paginates client-side over this
   * already-filtered result set, which is small enough (see `MAX_PAGE_LIMIT`) to keep in memory.
   */
  getCars(
    criteria: CarFilterCriteria = EMPTY_CAR_FILTER_CRITERIA,
    sort: CarSort = {},
  ): Observable<Car[]> {
    return this.fetchAllPages(toQueryParams(criteria, sort));
  }

  getCarById(id: string): Observable<Car> {
    return this.api.get<Car>(`${CARS_PATH}/${encodeURIComponent(id)}`);
  }

  /** Full URL for a direct browser download of the CSV export, honoring the same search/filters/sort. */
  buildExportUrl(criteria: CarFilterCriteria, sort: CarSort = {}): string {
    return this.api.buildUrl(EXPORT_PATH, toQueryParams(criteria, sort));
  }

  private fetchAllPages(
    baseParams: QueryParams,
    cursor?: string,
    accumulated: Car[] = [],
  ): Observable<Car[]> {
    const params = cursor ? { ...baseParams, cursor, limit: MAX_PAGE_LIMIT } : { ...baseParams, limit: MAX_PAGE_LIMIT };

    return this.api.get<PaginatedCars>(CARS_PATH, params).pipe(
      switchMap((page) => {
        const merged = [...accumulated, ...page.data];
        return page.hasMore && page.nextCursor
          ? this.fetchAllPages(baseParams, page.nextCursor, merged)
          : of(merged);
      }),
    );
  }
}
