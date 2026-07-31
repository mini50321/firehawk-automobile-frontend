import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarFilters } from './car-filters';
import { CarFilterCriteria, EMPTY_CAR_FILTER_CRITERIA } from '../../models/car-filter-criteria.model';

const STORAGE_KEY = 'firehawk-automobile.car-table-view-state';

describe('CarFilters', () => {
  let fixture: ComponentFixture<CarFilters>;

  function setup(): ComponentFixture<CarFilters> {
    TestBed.configureTestingModule({ imports: [CarFilters] });
    const fx = TestBed.createComponent(CarFilters);
    fx.detectChanges();
    return fx;
  }

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should create', () => {
    fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit the empty criteria once created', async () => {
    fixture = setup();
    const emitted: CarFilterCriteria[] = [];
    fixture.componentInstance.filtersChange.subscribe((criteria) => emitted.push(criteria));

    await vi.advanceTimersByTimeAsync(300);

    expect(emitted).toEqual([EMPTY_CAR_FILTER_CRITERIA]);
  });

  it('should emit debounced criteria when the search input changes', async () => {
    fixture = setup();
    const emitted: CarFilterCriteria[] = [];
    fixture.componentInstance.filtersChange.subscribe((criteria) => emitted.push(criteria));
    await vi.advanceTimersByTimeAsync(300);

    const input = fixture.nativeElement.querySelector(
      'input[formControlName="search"]',
    ) as HTMLInputElement;
    input.value = 'civic';
    input.dispatchEvent(new Event('input'));

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();

    expect(emitted.at(-1)?.search).toBe('civic');
  });

  it('should not emit again if the debounced value did not actually change', async () => {
    fixture = setup();
    const emitted: CarFilterCriteria[] = [];
    fixture.componentInstance.filtersChange.subscribe((criteria) => emitted.push(criteria));
    await vi.advanceTimersByTimeAsync(300);

    fixture.componentInstance['form'].controls.search.setValue('');
    await vi.advanceTimersByTimeAsync(300);

    expect(emitted).toHaveLength(1);
  });

  it('should emit the selected fuel type and price range', async () => {
    fixture = setup();
    const emitted: CarFilterCriteria[] = [];
    fixture.componentInstance.filtersChange.subscribe((criteria) => emitted.push(criteria));
    await vi.advanceTimersByTimeAsync(300);

    fixture.componentInstance['form'].patchValue({ fuelType: 'diesel', priceMin: 10000 });
    await vi.advanceTimersByTimeAsync(300);

    expect(emitted.at(-1)).toEqual({
      ...EMPTY_CAR_FILTER_CRITERIA,
      fuelType: 'diesel',
      price: { min: 10000, max: null },
    });
  });

  it('should expose the fixed enum options for each select', () => {
    fixture = setup();

    expect(fixture.componentInstance['fuelTypeOptions']).toEqual(['gas', 'diesel']);
    expect(fixture.componentInstance['aspirationOptions']).toEqual(['std', 'turbo']);
    expect(fixture.componentInstance['driveWheelsOptions']).toEqual(['4wd', 'fwd', 'rwd']);
  });

  it('should reset the form when resetFilters is invoked', async () => {
    fixture = setup();
    const emitted: CarFilterCriteria[] = [];
    fixture.componentInstance.filtersChange.subscribe((criteria) => emitted.push(criteria));
    await vi.advanceTimersByTimeAsync(300);

    fixture.componentInstance['form'].controls.search.setValue('civic');
    await vi.advanceTimersByTimeAsync(300);
    expect(emitted.at(-1)?.search).toBe('civic');

    fixture.componentInstance['resetFilters']();
    await vi.advanceTimersByTimeAsync(300);

    expect(emitted.at(-1)).toEqual(EMPTY_CAR_FILTER_CRITERIA);
  });

  describe('persistence', () => {
    it('should seed the form from previously persisted filters', async () => {
      const persisted = {
        filters: { ...EMPTY_CAR_FILTER_CRITERIA, search: 'civic', fuelType: 'gas' as const },
        sortActive: '',
        sortDirection: '' as const,
        pageIndex: 0,
        pageSize: 10,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

      fixture = setup();
      const emitted: CarFilterCriteria[] = [];
      fixture.componentInstance.filtersChange.subscribe((criteria) => emitted.push(criteria));
      await vi.advanceTimersByTimeAsync(300);

      const searchInput = fixture.nativeElement.querySelector(
        'input[formControlName="search"]',
      ) as HTMLInputElement;
      expect(searchInput.value).toBe('civic');
      expect(emitted.at(-1)).toEqual(persisted.filters);
    });

    it('should persist criteria changes to storage', async () => {
      fixture = setup();
      await vi.advanceTimersByTimeAsync(300);

      fixture.componentInstance['form'].controls.search.setValue('civic');
      await vi.advanceTimersByTimeAsync(300);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      expect(stored.filters.search).toBe('civic');
    });
  });
});
