import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subject, map, of, throwError } from 'rxjs';

import { CarTable } from './car-table';
import { AutomobileRepository } from '../../services/automobile-repository';
import { CarDetailsDialog } from '../car-details-dialog/car-details-dialog';
import { Car } from '../../models/car.model';

function buildCar(overrides: Partial<Car> & Pick<Car, 'id'>): Car {
  return {
    make: 'Toyota',
    model: 'Corolla',
    year: 2024,
    vin: '1HGCM82633A004352',
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

describe('CarTable', () => {
  let fixture: ComponentFixture<CarTable>;
  let handsetMatches$: BehaviorSubject<boolean>;
  let dialogOpen: ReturnType<typeof vi.fn>;

  function setup(cars$: Observable<Car[]>): ComponentFixture<CarTable> {
    handsetMatches$ = new BehaviorSubject<boolean>(false);
    dialogOpen = vi.fn();

    TestBed.configureTestingModule({
      imports: [CarTable],
      providers: [
        { provide: AutomobileRepository, useValue: { getCars: () => cars$ } },
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () =>
              handsetMatches$.pipe(
                map((matches): BreakpointState => ({ matches, breakpoints: {} })),
              ),
          },
        },
        { provide: MatDialog, useValue: { open: dialogOpen } },
      ],
    });

    return TestBed.createComponent(CarTable);
  }

  function headerTexts(root: HTMLElement): string[] {
    return Array.from(root.querySelectorAll('th')).map((th) => th.textContent?.trim() ?? '');
  }

  function bodyRows(root: HTMLElement): HTMLTableRowElement[] {
    return Array.from(root.querySelectorAll('tbody tr'));
  }

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    fixture = setup(of([]));
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show a loading indicator while cars are being fetched', () => {
    fixture = setup(new Subject<Car[]>());
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(progressBar).toBeTruthy();
  });

  it('should hide the loading indicator and render rows once cars load', () => {
    const cars = [buildCar({ id: '1', make: 'Toyota' }), buildCar({ id: '2', make: 'Honda' })];
    fixture = setup(of(cars));
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(progressBar).toBeFalsy();
    expect(bodyRows(fixture.nativeElement)).toHaveLength(2);
  });

  it('should show an empty-state message when there are no cars', () => {
    fixture = setup(of([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No automobiles found.');
  });

  it('should show an error message when the repository fails', () => {
    fixture = setup(throwError(() => new Error('network down')));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Failed to load automobiles.');
  });

  it('should paginate results using the configured page size', async () => {
    const cars = Array.from({ length: 15 }, (_, i) =>
      buildCar({ id: `${i}`, make: `Make${i.toString().padStart(2, '0')}` }),
    );
    fixture = setup(of(cars));
    fixture.detectChanges();

    // Restoring sort/pagination state, and MatTableDataSource syncing
    // `paginator.length`, both happen in a deferred microtask (to avoid
    // ExpressionChangedAfterItHasBeenCheckedError), so they must be flushed
    // before asserting on rendered rows or paginator button state.
    await fixture.whenStable();
    fixture.detectChanges();

    expect(bodyRows(fixture.nativeElement)).toHaveLength(10);

    const root = fixture.nativeElement as HTMLElement;
    const nextPageButton = root.querySelector<HTMLButtonElement>('button[aria-label="Next page"]');
    expect(nextPageButton).toBeTruthy();
    nextPageButton?.click();
    fixture.detectChanges();

    expect(bodyRows(fixture.nativeElement)).toHaveLength(5);
  });

  it('should sort rows when a sortable header is clicked', async () => {
    const cars = [
      buildCar({ id: '1', make: 'Toyota' }),
      buildCar({ id: '2', make: 'Acura' }),
      buildCar({ id: '3', make: 'BMW' }),
    ];
    fixture = setup(of(cars));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const makeHeader = Array.from(root.querySelectorAll<HTMLElement>('th.mat-sort-header')).find(
      (th) => th.textContent?.trim() === 'Make',
    );
    expect(makeHeader).toBeTruthy();

    makeHeader?.click();
    fixture.detectChanges();

    const firstCellText = bodyRows(fixture.nativeElement)[0].querySelector('td')?.textContent;
    expect(firstCellText).toContain('Acura');
  });

  it('should show all columns by default on non-handset viewports', () => {
    fixture = setup(of([buildCar({ id: '1' })]));
    fixture.detectChanges();

    expect(headerTexts(fixture.nativeElement)).toEqual([
      'Make',
      'Model',
      'Year',
      'Price',
      'Color',
      'Mileage',
      'VIN',
      'Status',
      'Origin',
      'Cyl',
      'MPG',
      'HP',
      'Weight',
    ]);
  });

  it('should collapse to the core columns when the breakpoint reports a handset', () => {
    fixture = setup(of([buildCar({ id: '1' })]));
    fixture.detectChanges();

    handsetMatches$.next(true);
    fixture.detectChanges();

    expect(headerTexts(fixture.nativeElement)).toEqual(['Make', 'Model', 'Year', 'Price']);
  });

  describe('filtering', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should narrow visible rows when a search term is entered', async () => {
      const cars = [
        buildCar({ id: '1', make: 'Toyota', model: 'Corolla' }),
        buildCar({ id: '2', make: 'Honda', model: 'Civic' }),
      ];
      fixture = setup(of(cars));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(bodyRows(fixture.nativeElement)).toHaveLength(2);

      const searchInput = fixture.nativeElement.querySelector(
        'input[formControlName="search"]',
      ) as HTMLInputElement;
      searchInput.value = 'civic';
      searchInput.dispatchEvent(new Event('input'));

      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      const rows = bodyRows(fixture.nativeElement);
      expect(rows).toHaveLength(1);
      expect(rows[0].textContent).toContain('Honda');
    });

    it('should show a filters-specific empty state when nothing matches', async () => {
      const cars = [buildCar({ id: '1', make: 'Toyota', model: 'Corolla' })];
      fixture = setup(of(cars));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(300);

      const searchInput = fixture.nativeElement.querySelector(
        'input[formControlName="search"]',
      ) as HTMLInputElement;
      searchInput.value = 'nonexistent';
      searchInput.dispatchEvent(new Event('input'));

      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No automobiles match your filters.');
    });

    it('should recompute the stats cards to reflect only the filtered cars', async () => {
      const cars = [
        buildCar({ id: '1', make: 'Toyota', model: 'Corolla', mpg: 30 }),
        buildCar({ id: '2', make: 'Honda', model: 'Civic', mpg: 40 }),
      ];
      fixture = setup(of(cars));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      const totalBefore = fixture.nativeElement.querySelector('.car-stats-value')?.textContent;
      expect(totalBefore?.trim()).toBe('2');

      const searchInput = fixture.nativeElement.querySelector(
        'input[formControlName="search"]',
      ) as HTMLInputElement;
      searchInput.value = 'civic';
      searchInput.dispatchEvent(new Event('input'));
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      const values = Array.from(root.querySelectorAll('.car-stats-value')).map((el) =>
        el.textContent?.trim(),
      );
      expect(values[0]).toBe('1');
      expect(values[1]).toBe('40');
    });
  });

  describe('details dialog', () => {
    it('should open the details dialog with the clicked car when a row is clicked', () => {
      const car = buildCar({ id: '1', make: 'Toyota', model: 'Corolla' });
      fixture = setup(of([car]));
      fixture.detectChanges();

      const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
      row.click();

      expect(dialogOpen).toHaveBeenCalledWith(
        CarDetailsDialog,
        expect.objectContaining({ data: car }),
      );
    });

    it('should open the details dialog when Enter is pressed on a focused row', () => {
      const car = buildCar({ id: '1', make: 'Toyota', model: 'Corolla' });
      fixture = setup(of([car]));
      fixture.detectChanges();

      const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(dialogOpen).toHaveBeenCalledWith(
        CarDetailsDialog,
        expect.objectContaining({ data: car }),
      );
    });

    it('should mark rows as keyboard-focusable buttons for accessibility', () => {
      const car = buildCar({ id: '1', make: 'Toyota', model: 'Corolla' });
      fixture = setup(of([car]));
      fixture.detectChanges();

      const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
      expect(row.getAttribute('role')).toBe('button');
      expect(row.getAttribute('tabindex')).toBe('0');
      expect(row.getAttribute('aria-label')).toBe('View details for Toyota Corolla');
    });
  });

  describe('persistence', () => {
    const STORAGE_KEY = 'firehawk-automobile.car-table-view-state';

    it('should restore sort and pagination from persisted state', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          filters: {
            search: '',
            origin: null,
            cylinders: null,
            modelYear: null,
            mpg: { min: null, max: null },
            horsepower: { min: null, max: null },
            weight: { min: null, max: null },
          },
          sortActive: 'make',
          sortDirection: 'desc',
          pageIndex: 1,
          pageSize: 5,
        }),
      );

      const cars = Array.from({ length: 15 }, (_, i) =>
        buildCar({ id: `${i}`, make: `Make${i.toString().padStart(2, '0')}` }),
      );
      fixture = setup(of(cars));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const rows = bodyRows(fixture.nativeElement);
      expect(rows).toHaveLength(5);
      expect(rows[0].querySelector('td')?.textContent).toContain('Make09');
    });

    it('should persist sort changes when a sortable header is clicked', () => {
      const cars = [buildCar({ id: '1', make: 'Toyota' }), buildCar({ id: '2', make: 'Acura' })];
      fixture = setup(of(cars));
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      const makeHeader = Array.from(root.querySelectorAll<HTMLElement>('th.mat-sort-header')).find(
        (th) => th.textContent?.trim() === 'Make',
      );
      makeHeader?.click();
      fixture.detectChanges();

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      expect(stored.sortActive).toBe('make');
      expect(stored.sortDirection).toBe('asc');
    });

    it('should persist page changes when the paginator is used', async () => {
      const cars = Array.from({ length: 15 }, (_, i) => buildCar({ id: `${i}` }));
      fixture = setup(of(cars));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      const nextPageButton = root.querySelector<HTMLButtonElement>(
        'button[aria-label="Next page"]',
      );
      nextPageButton?.click();
      fixture.detectChanges();

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      expect(stored.pageIndex).toBe(1);
      expect(stored.pageSize).toBe(10);
    });
  });
});
