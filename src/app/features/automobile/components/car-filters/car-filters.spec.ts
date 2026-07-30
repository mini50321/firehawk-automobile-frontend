import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarFilters } from './car-filters';
import { Car } from '../../models/car.model';
import {
  CarFilterCriteria,
  EMPTY_CAR_FILTER_CRITERIA,
} from '../../models/car-filter-criteria.model';

const STORAGE_KEY = 'firehawk-automobile.car-table-view-state';

function buildCar(overrides: Partial<Car> & Pick<Car, 'id'>): Car {
  return {
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vin: '1HGCM82633A000000',
    color: 'Blue',
    mileage: 10000,
    price: 20000,
    status: 'available',
    origin: 'Japan',
    cylinders: 4,
    mpg: 32,
    horsepower: 140,
    weight: 2900,
    ...overrides,
  };
}

describe('CarFilters', () => {
  let fixture: ComponentFixture<CarFilters>;

  const cars: Car[] = [
    buildCar({ id: '1', origin: 'Japan', cylinders: 4, year: 2020 }),
    buildCar({ id: '2', origin: 'USA', cylinders: 8, year: 2022 }),
  ];

  function setup(carsInput: Car[]): ComponentFixture<CarFilters> {
    TestBed.configureTestingModule({ imports: [CarFilters] });
    const fx = TestBed.createComponent(CarFilters);
    fx.componentRef.setInput('cars', carsInput);
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
    fixture = setup(cars);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit the empty criteria once created', async () => {
    fixture = setup(cars);
    const emitted: CarFilterCriteria[] = [];
    fixture.componentInstance.filtersChange.subscribe((criteria) => emitted.push(criteria));

    await vi.advanceTimersByTimeAsync(300);

    expect(emitted).toEqual([EMPTY_CAR_FILTER_CRITERIA]);
  });

  it('should emit debounced criteria when the search input changes', async () => {
    fixture = setup(cars);
    const emitted: CarFilterCriteria[] = [];
    fixture.componentInstance.filtersChange.subscribe((criteria) => emitted.push(criteria));
    await vi.advanceTimersByTimeAsync(300);

    const input = fixture.nativeElement.querySelector(
      'input[formControlName="search"]',
    ) as HTMLInputElement;
    input.value = 'Corolla';
    input.dispatchEvent(new Event('input'));

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();

    expect(emitted.at(-1)?.search).toBe('Corolla');
  });

  it('should not emit again if the debounced value did not actually change', async () => {
    fixture = setup(cars);
    const emitted: CarFilterCriteria[] = [];
    fixture.componentInstance.filtersChange.subscribe((criteria) => emitted.push(criteria));
    await vi.advanceTimersByTimeAsync(300);

    fixture.componentInstance['form'].controls.search.setValue('');
    await vi.advanceTimersByTimeAsync(300);

    expect(emitted).toHaveLength(1);
  });

  it('should derive origin, cylinder, and model-year options from the cars input', () => {
    fixture = setup(cars);

    expect(fixture.componentInstance['origins']()).toEqual(['Japan', 'USA']);
    expect(fixture.componentInstance['cylinderOptions']()).toEqual([4, 8]);
    expect(fixture.componentInstance['modelYears']()).toEqual([2020, 2022]);
  });

  it('should reset the form when resetFilters is invoked', async () => {
    fixture = setup(cars);
    const emitted: CarFilterCriteria[] = [];
    fixture.componentInstance.filtersChange.subscribe((criteria) => emitted.push(criteria));
    await vi.advanceTimersByTimeAsync(300);

    fixture.componentInstance['form'].controls.search.setValue('Corolla');
    await vi.advanceTimersByTimeAsync(300);
    expect(emitted.at(-1)?.search).toBe('Corolla');

    fixture.componentInstance['resetFilters']();
    await vi.advanceTimersByTimeAsync(300);

    expect(emitted.at(-1)).toEqual(EMPTY_CAR_FILTER_CRITERIA);
  });

  describe('persistence', () => {
    it('should seed the form from previously persisted filters', async () => {
      const persisted = {
        filters: { ...EMPTY_CAR_FILTER_CRITERIA, search: 'civic', origin: 'USA' as const },
        sortActive: '',
        sortDirection: '' as const,
        pageIndex: 0,
        pageSize: 10,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

      fixture = setup(cars);
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
      fixture = setup(cars);
      await vi.advanceTimersByTimeAsync(300);

      fixture.componentInstance['form'].controls.search.setValue('corolla');
      await vi.advanceTimersByTimeAsync(300);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      expect(stored.filters.search).toBe('corolla');
    });
  });
});
