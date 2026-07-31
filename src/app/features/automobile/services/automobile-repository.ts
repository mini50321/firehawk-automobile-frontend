import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';

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

/**
 * Firestore allows only one range (inequality) filter per query — a name-prefix search (`q`) and
 * an MPG range (`minMpg`/`maxMpg`) both need one, so the backend rejects the combination with a
 * 400 rather than let it silently misbehave. `getCars` and `buildExportUrl`'s caller both work
 * around this the same way: drop the MPG range from the server query and apply it client-side.
 */
export function hasSearchMpgConflict(criteria: CarFilterCriteria): boolean {
  return criteria.search.trim().length > 0 && (criteria.mpg.min !== null || criteria.mpg.max !== null);
}

function withinMpgRange(mpg: number, range: CarFilterCriteria['mpg']): boolean {
  return (range.min === null || mpg >= range.min) && (range.max === null || mpg <= range.max);
}

function toQueryParams(criteria: CarFilterCriteria, sort: CarSort): QueryParams {
  const params: QueryParams = {};
  const search = criteria.search.trim();

  if (search) params['q'] = search;
  if (criteria.origin) params['origin'] = criteria.origin;
  if (criteria.cylinders !== null) params['cylinders'] = criteria.cylinders;
  if (criteria.mpg.min !== null) params['minMpg'] = criteria.mpg.min;
  if (criteria.mpg.max !== null) params['maxMpg'] = criteria.mpg.max;
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
    if (hasSearchMpgConflict(criteria)) {
      const searchOnly: CarFilterCriteria = { ...criteria, mpg: { min: null, max: null } };
      return this.fetchAllPages(toQueryParams(searchOnly, sort)).pipe(
        map((cars) => cars.filter((car) => withinMpgRange(car.mpg, criteria.mpg))),
      );
    }

    return this.fetchAllPages(toQueryParams(criteria, sort));
  }

  getCarById(id: string): Observable<Car> {
    return this.api.get<Car>(`${CARS_PATH}/${encodeURIComponent(id)}`);
  }

  /** Requires the admin key (see `AdminAuth`) — the backend rejects this with 401 without it. */
  createCar(data: Omit<Car, 'id'>, adminKey: string): Observable<Car> {
    return this.api.post<Car>(CARS_PATH, data, { headers: { 'X-Admin-Key': adminKey } });
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
