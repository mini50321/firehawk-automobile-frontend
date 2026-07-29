import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BehaviorSubject, Observable, Subject, map, of, throwError } from 'rxjs';

import { CarTable } from './car-table';
import { AutomobileRepository } from '../../services/automobile-repository';
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

  function setup(cars$: Observable<Car[]>): ComponentFixture<CarTable> {
    handsetMatches$ = new BehaviorSubject<boolean>(false);

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

    expect(bodyRows(fixture.nativeElement)).toHaveLength(10);

    // MatTableDataSource syncs `paginator.length` in a microtask (to avoid
    // ExpressionChangedAfterItHasBeenCheckedError), so it must be flushed
    // before the paginator's next-page button becomes enabled.
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const nextPageButton = root.querySelector<HTMLButtonElement>('button[aria-label="Next page"]');
    expect(nextPageButton).toBeTruthy();
    nextPageButton?.click();
    fixture.detectChanges();

    expect(bodyRows(fixture.nativeElement)).toHaveLength(5);
  });

  it('should sort rows when a sortable header is clicked', () => {
    const cars = [
      buildCar({ id: '1', make: 'Toyota' }),
      buildCar({ id: '2', make: 'Acura' }),
      buildCar({ id: '3', make: 'BMW' }),
    ];
    fixture = setup(of(cars));
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
  });
});
