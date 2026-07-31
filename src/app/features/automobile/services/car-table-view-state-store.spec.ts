import { TestBed } from '@angular/core/testing';

import { CarTableViewStateStore } from './car-table-view-state-store';
import { DEFAULT_CAR_TABLE_VIEW_STATE } from '../models/car-table-view-state.model';
import { EMPTY_CAR_FILTER_CRITERIA } from '../models/car-filter-criteria.model';

const STORAGE_KEY = 'firehawk-automobile.car-table-view-state';

describe('CarTableViewStateStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    const store = TestBed.inject(CarTableViewStateStore);
    expect(store).toBeTruthy();
  });

  it('should default to the empty state when nothing is stored', () => {
    const store = TestBed.inject(CarTableViewStateStore);
    expect(store.snapshot()).toEqual(DEFAULT_CAR_TABLE_VIEW_STATE);
  });

  it('should restore a previously persisted state', () => {
    const persisted = {
      filters: { ...EMPTY_CAR_FILTER_CRITERIA, search: 'civic' },
      sortActive: 'price',
      sortDirection: 'asc' as const,
      pageIndex: 2,
      pageSize: 25,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

    const store = TestBed.inject(CarTableViewStateStore);

    expect(store.snapshot()).toEqual(persisted);
  });

  it('should fall back to the default state when stored data is malformed', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ garbage: true }));

    const store = TestBed.inject(CarTableViewStateStore);

    expect(store.snapshot()).toEqual(DEFAULT_CAR_TABLE_VIEW_STATE);
  });

  describe('validation of otherwise well-shaped stored state', () => {
    const validState = {
      filters: EMPTY_CAR_FILTER_CRITERIA,
      sortActive: 'price',
      sortDirection: 'asc' as const,
      pageIndex: 1,
      pageSize: 25,
    };

    it('should accept a fully valid stored state as-is', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validState));

      const store = TestBed.inject(CarTableViewStateStore);

      expect(store.snapshot()).toEqual(validState);
    });

    it('should reject a state with an invalid sortDirection value', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...validState, sortDirection: 'sideways' }),
      );

      const store = TestBed.inject(CarTableViewStateStore);

      expect(store.snapshot()).toEqual(DEFAULT_CAR_TABLE_VIEW_STATE);
    });

    it('should reject a state with a non-numeric pageIndex', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...validState, pageIndex: '1' }));

      const store = TestBed.inject(CarTableViewStateStore);

      expect(store.snapshot()).toEqual(DEFAULT_CAR_TABLE_VIEW_STATE);
    });

    it('should reject a state with a non-numeric pageSize', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...validState, pageSize: null }));

      const store = TestBed.inject(CarTableViewStateStore);

      expect(store.snapshot()).toEqual(DEFAULT_CAR_TABLE_VIEW_STATE);
    });

    it('should reject a state with a non-string sortActive', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...validState, sortActive: 42 }));

      const store = TestBed.inject(CarTableViewStateStore);

      expect(store.snapshot()).toEqual(DEFAULT_CAR_TABLE_VIEW_STATE);
    });

    it('should reject a state with a missing filters object', () => {
      const withoutFilters = {
        sortActive: validState.sortActive,
        sortDirection: validState.sortDirection,
        pageIndex: validState.pageIndex,
        pageSize: validState.pageSize,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutFilters));

      const store = TestBed.inject(CarTableViewStateStore);

      expect(store.snapshot()).toEqual(DEFAULT_CAR_TABLE_VIEW_STATE);
    });

    it('should reject filters persisted under a previous, incompatible schema instead of passing them through', () => {
      // Regression test: a browser with state saved before the filter schema changed from
      // {fuelType, bodyStyle, price: {min,max}, ...} to {origin, cylinders, mpg: {min,max}} must
      // have that stale state discarded, not handed to CarFilters as-is — a missing `mpg` field
      // throws deep inside its constructor (`criteria.mpg.min`) and takes the whole page down.
      const staleFilters = {
        search: 'civic',
        fuelType: 'gas',
        bodyStyle: 'sedan',
        price: { min: 5000, max: null },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...validState, filters: staleFilters }),
      );

      const store = TestBed.inject(CarTableViewStateStore);

      expect(store.snapshot()).toEqual(DEFAULT_CAR_TABLE_VIEW_STATE);
    });

    it('should reject a state with an invalid origin value in filters', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...validState,
          filters: { ...EMPTY_CAR_FILTER_CRITERIA, origin: 'germany' },
        }),
      );

      const store = TestBed.inject(CarTableViewStateStore);

      expect(store.snapshot()).toEqual(DEFAULT_CAR_TABLE_VIEW_STATE);
    });

    it('should reject a state with a non-object mpg field in filters', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...validState, filters: { ...EMPTY_CAR_FILTER_CRITERIA, mpg: null } }),
      );

      const store = TestBed.inject(CarTableViewStateStore);

      expect(store.snapshot()).toEqual(DEFAULT_CAR_TABLE_VIEW_STATE);
    });
  });

  it('should persist and reflect filter updates', () => {
    const store = TestBed.inject(CarTableViewStateStore);
    const filters = { ...EMPTY_CAR_FILTER_CRITERIA, search: 'corolla' };

    store.updateFilters(filters);

    expect(store.snapshot().filters).toEqual(filters);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').filters).toEqual(filters);
  });

  it('should persist and reflect sort updates', () => {
    const store = TestBed.inject(CarTableViewStateStore);

    store.updateSort('make', 'desc');

    expect(store.snapshot().sortActive).toBe('make');
    expect(store.snapshot().sortDirection).toBe('desc');
  });

  it('should persist and reflect page updates', () => {
    const store = TestBed.inject(CarTableViewStateStore);

    store.updatePage(3, 50);

    expect(store.snapshot().pageIndex).toBe(3);
    expect(store.snapshot().pageSize).toBe(50);
  });

  it('should merge partial updates without discarding other fields', () => {
    const store = TestBed.inject(CarTableViewStateStore);

    store.updateSort('year', 'asc');
    store.updatePage(1, 25);

    expect(store.snapshot()).toEqual({
      ...DEFAULT_CAR_TABLE_VIEW_STATE,
      sortActive: 'year',
      sortDirection: 'asc',
      pageIndex: 1,
      pageSize: 25,
    });
  });
});
