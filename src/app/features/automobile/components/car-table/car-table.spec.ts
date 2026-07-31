import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subject, map, of, throwError } from 'rxjs';

import { CarTable } from './car-table';
import { AutomobileRepository } from '../../services/automobile-repository';
import { CarDetailsDialog } from '../car-details-dialog/car-details-dialog';
import { Car } from '../../models/car.model';
import { CarFilterCriteria, EMPTY_CAR_FILTER_CRITERIA } from '../../models/car-filter-criteria.model';
import { FileDownload } from '../../../../core/services/file-download';
import { Feedback } from '../../../../core/services/feedback';

function buildCar(overrides: Partial<Car> & Pick<Car, 'id'>): Car {
  return {
    name: 'chevrolet chevelle malibu',
    mpg: 18,
    cylinders: 8,
    displacement: 307,
    horsepower: 130,
    weight: 3504,
    acceleration: 12,
    modelYear: 1970,
    origin: 'usa',
    ...overrides,
  };
}

interface RepositoryStub {
  getCars: ReturnType<typeof vi.fn>;
  buildExportUrl: ReturnType<typeof vi.fn>;
}

/** A repository stub that always returns the same set, ignoring whatever criteria it's called with. */
function fixedRepository(cars$: Observable<Car[]>): RepositoryStub {
  return {
    getCars: vi.fn().mockReturnValue(cars$),
    buildExportUrl: vi.fn().mockReturnValue('https://api.example.com/cars/export'),
  };
}

/** A repository stub that behaves like a (very simplified) real backend: it actually filters
 *  `allCars` by the criteria it's called with, the way the real server-side search does. */
function searchableRepository(allCars: Car[]): RepositoryStub {
  return {
    getCars: vi.fn((criteria: CarFilterCriteria = EMPTY_CAR_FILTER_CRITERIA) => {
      const search = criteria.search.trim().toLowerCase();
      const filtered = allCars.filter((car) => !search || car.name.toLowerCase().includes(search));
      return of(filtered);
    }),
    buildExportUrl: vi.fn().mockReturnValue('https://api.example.com/cars/export'),
  };
}

describe('CarTable', () => {
  let fixture: ComponentFixture<CarTable>;
  let handsetMatches$: BehaviorSubject<boolean>;
  let dialogOpen: ReturnType<typeof vi.fn>;
  let downloadFromUrl: ReturnType<typeof vi.fn>;
  let downloadText: ReturnType<typeof vi.fn>;
  let feedbackShow: ReturnType<typeof vi.fn>;

  function setup(repository: RepositoryStub): ComponentFixture<CarTable> {
    handsetMatches$ = new BehaviorSubject<boolean>(false);
    dialogOpen = vi.fn();
    downloadFromUrl = vi.fn();
    downloadText = vi.fn();
    feedbackShow = vi.fn();

    TestBed.configureTestingModule({
      imports: [CarTable],
      providers: [
        { provide: AutomobileRepository, useValue: repository },
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
        { provide: FileDownload, useValue: { downloadFromUrl, downloadText } },
        { provide: Feedback, useValue: { show: feedbackShow } },
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
    fixture = setup(fixedRepository(of([])));
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show a loading indicator while cars are being fetched', () => {
    fixture = setup(fixedRepository(new Subject<Car[]>()));
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(progressBar).toBeTruthy();
  });

  it('should hide the loading indicator and render rows once cars load', () => {
    const cars = [buildCar({ id: '1', name: 'toyota corona' }), buildCar({ id: '2', name: 'honda civic' })];
    fixture = setup(fixedRepository(of(cars)));
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(progressBar).toBeFalsy();
    expect(bodyRows(fixture.nativeElement)).toHaveLength(2);
  });

  it('should show an empty-state message when there are no cars', () => {
    fixture = setup(fixedRepository(of([])));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No automobiles yet');
  });

  it('should show an error message when the repository fails', () => {
    fixture = setup(fixedRepository(throwError(() => new Error('network down'))));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Failed to load automobiles.');
  });

  it('should call the repository with the current filter criteria', () => {
    const repository = fixedRepository(of([]));
    fixture = setup(repository);
    fixture.detectChanges();

    expect(repository.getCars).toHaveBeenCalledWith(EMPTY_CAR_FILTER_CRITERIA);
  });

  it('should paginate results using the configured page size', async () => {
    const cars = Array.from({ length: 15 }, (_, i) =>
      buildCar({ id: `${i}`, name: `car${i.toString().padStart(2, '0')}` }),
    );
    fixture = setup(fixedRepository(of(cars)));
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
      buildCar({ id: '1', name: 'toyota corona' }),
      buildCar({ id: '2', name: 'acura legend' }),
      buildCar({ id: '3', name: 'bmw 320i' }),
    ];
    fixture = setup(fixedRepository(of(cars)));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const nameHeader = Array.from(root.querySelectorAll<HTMLElement>('th.mat-sort-header')).find(
      (th) => th.textContent?.trim() === 'Name',
    );
    expect(nameHeader).toBeTruthy();

    nameHeader?.click();
    fixture.detectChanges();

    const firstCellText = bodyRows(fixture.nativeElement)[0].querySelector('td')?.textContent;
    expect(firstCellText).toContain('Acura Legend');
  });

  it('should show all columns by default on non-handset viewports', () => {
    fixture = setup(fixedRepository(of([buildCar({ id: '1' })])));
    fixture.detectChanges();

    expect(headerTexts(fixture.nativeElement)).toEqual([
      'Name',
      'Origin',
      'MPG',
      'HP',
      'Cyl',
      'Displacement',
      'Weight',
      'Accel',
      'Year',
    ]);
  });

  it('should collapse to the core columns when the breakpoint reports a handset', () => {
    fixture = setup(fixedRepository(of([buildCar({ id: '1' })])));
    fixture.detectChanges();

    handsetMatches$.next(true);
    fixture.detectChanges();

    expect(headerTexts(fixture.nativeElement)).toEqual(['Name', 'Origin', 'MPG', 'HP']);
  });

  describe('filtering', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should re-fetch from the backend (server-side search) when a search term is entered', async () => {
      const cars = [buildCar({ id: '1', name: 'toyota corona' }), buildCar({ id: '2', name: 'honda civic' })];
      const repository = searchableRepository(cars);
      fixture = setup(repository);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(bodyRows(fixture.nativeElement)).toHaveLength(2);

      const searchInput = fixture.nativeElement.querySelector(
        'input[formControlName="search"]',
      ) as HTMLInputElement;
      searchInput.value = 'honda';
      searchInput.dispatchEvent(new Event('input'));

      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      const rows = bodyRows(fixture.nativeElement);
      expect(rows).toHaveLength(1);
      expect(rows[0].textContent).toContain('Honda Civic');
      expect(repository.getCars).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'honda' }),
      );
    });

    it('should show a filters-specific empty state when nothing matches', async () => {
      const cars = [buildCar({ id: '1', name: 'toyota corona' })];
      fixture = setup(searchableRepository(cars));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(300);

      const searchInput = fixture.nativeElement.querySelector(
        'input[formControlName="search"]',
      ) as HTMLInputElement;
      searchInput.value = 'nonexistent';
      searchInput.dispatchEvent(new Event('input'));

      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No automobiles match your filters');
    });

    it('should offer a Reset Filters action in the empty state, which clears the filters', async () => {
      const cars = [buildCar({ id: '1', name: 'toyota corona' })];
      fixture = setup(searchableRepository(cars));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(300);

      const searchInput = fixture.nativeElement.querySelector(
        'input[formControlName="search"]',
      ) as HTMLInputElement;
      searchInput.value = 'nonexistent';
      searchInput.dispatchEvent(new Event('input'));
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      const resetButton = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
      ).find((btn) => btn.textContent?.trim() === 'Reset Filters');
      expect(resetButton).toBeTruthy();

      resetButton?.click();
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(bodyRows(fixture.nativeElement)).toHaveLength(1);
      expect(searchInput.value).toBe('');
      expect(feedbackShow).toHaveBeenCalledWith('Filters reset.');
    });

    it('should recompute the stats cards to reflect only the filtered cars', async () => {
      const cars = [
        buildCar({ id: '1', name: 'toyota corona', mpg: 30 }),
        buildCar({ id: '2', name: 'honda civic', mpg: 40 }),
      ];
      fixture = setup(searchableRepository(cars));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      const totalBefore = fixture.nativeElement.querySelector('.car-stats-value')?.textContent;
      expect(totalBefore?.trim()).toBe('2');

      const searchInput = fixture.nativeElement.querySelector(
        'input[formControlName="search"]',
      ) as HTMLInputElement;
      searchInput.value = 'honda';
      searchInput.dispatchEvent(new Event('input'));
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      const values = Array.from(root.querySelectorAll('.car-stats-value')).map((el) =>
        el.textContent?.trim(),
      );
      expect(values[0]).toBe('1');
      expect(values[1]).toBe('40.0');
    });
  });

  describe('details dialog', () => {
    it('should open the details dialog with the clicked car when a row is clicked', () => {
      const car = buildCar({ id: '1', name: 'toyota corona' });
      fixture = setup(fixedRepository(of([car])));
      fixture.detectChanges();

      const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
      row.click();

      expect(dialogOpen).toHaveBeenCalledWith(
        CarDetailsDialog,
        expect.objectContaining({ data: car }),
      );
    });

    it('should open the details dialog when Enter is pressed on a focused row', () => {
      const car = buildCar({ id: '1', name: 'toyota corona' });
      fixture = setup(fixedRepository(of([car])));
      fixture.detectChanges();

      const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(dialogOpen).toHaveBeenCalledWith(
        CarDetailsDialog,
        expect.objectContaining({ data: car }),
      );
    });

    it('should mark rows as keyboard-focusable buttons for accessibility', () => {
      const car = buildCar({ id: '1', name: 'toyota corona' });
      fixture = setup(fixedRepository(of([car])));
      fixture.detectChanges();

      const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
      expect(row.getAttribute('role')).toBe('button');
      expect(row.getAttribute('tabindex')).toBe('0');
      expect(row.getAttribute('aria-label')).toBe('View details for toyota corona');
    });
  });

  describe('CSV export', () => {
    function exportButton(root: HTMLElement): HTMLButtonElement | null {
      return Array.from(root.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Export CSV'),
      ) as HTMLButtonElement | null;
    }

    it('should download the backend CSV export URL (honoring current filters) when Export CSV is clicked', () => {
      const cars = [buildCar({ id: '1', name: 'toyota corona' }), buildCar({ id: '2', name: 'honda civic' })];
      const repository = fixedRepository(of(cars));
      fixture = setup(repository);
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      exportButton(root)?.click();

      expect(repository.buildExportUrl).toHaveBeenCalledWith(
        EMPTY_CAR_FILTER_CRITERIA,
        expect.objectContaining({}),
      );
      expect(downloadFromUrl).toHaveBeenCalledWith('https://api.example.com/cars/export');
      expect(feedbackShow).toHaveBeenCalledWith('Exporting automobiles to CSV…');
    });

    it('should disable the export button when there are no cars to export', () => {
      fixture = setup(fixedRepository(of([])));
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      expect(exportButton(root)?.disabled).toBe(true);
    });

    it('should show feedback instead of exporting when there are no cars', () => {
      const repository = fixedRepository(of([]));
      fixture = setup(repository);
      fixture.detectChanges();

      // The button is disabled in the DOM, but exercise the guard directly too.
      fixture.componentInstance['exportCsv']();

      expect(downloadFromUrl).not.toHaveBeenCalled();
      expect(feedbackShow).toHaveBeenCalledWith('No automobiles to export.');
    });

    it('should build the CSV client-side instead of calling the backend when search + an MPG range are both active', () => {
      // Regression test: the backend rejects q + an MPG range with a 400 (Firestore's one
      // range-filter-per-query limit) — export must fall back to building the CSV from the
      // already-loaded `cars()` instead of hitting `/cars/export` with that same combination.
      const cars = [buildCar({ id: '1', name: 'toyota corona', mpg: 24 })];
      const repository = fixedRepository(of(cars));
      fixture = setup(repository);
      fixture.detectChanges();

      fixture.componentInstance['filterCriteria'].set({
        search: 'toyota',
        origin: null,
        cylinders: null,
        mpg: { min: 20, max: 30 },
      });
      fixture.detectChanges();

      fixture.componentInstance['exportCsv']();

      expect(repository.buildExportUrl).not.toHaveBeenCalled();
      expect(downloadFromUrl).not.toHaveBeenCalled();
      expect(downloadText).toHaveBeenCalledWith(
        'automobiles.csv',
        expect.stringContaining('toyota corona'),
      );
      expect(feedbackShow).toHaveBeenCalledWith('Exporting automobiles to CSV…');
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
            mpg: { min: null, max: null },
          },
          sortActive: 'name',
          sortDirection: 'desc',
          pageIndex: 1,
          pageSize: 5,
        }),
      );

      const cars = Array.from({ length: 15 }, (_, i) =>
        buildCar({ id: `${i}`, name: `car${i.toString().padStart(2, '0')}` }),
      );
      fixture = setup(fixedRepository(of(cars)));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const rows = bodyRows(fixture.nativeElement);
      expect(rows).toHaveLength(5);
      expect(rows[0].querySelector('td')?.textContent).toContain('Car09');
    });

    it('should persist sort changes when a sortable header is clicked', () => {
      const cars = [buildCar({ id: '1', name: 'toyota corona' }), buildCar({ id: '2', name: 'acura legend' })];
      fixture = setup(fixedRepository(of(cars)));
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      const nameHeader = Array.from(root.querySelectorAll<HTMLElement>('th.mat-sort-header')).find(
        (th) => th.textContent?.trim() === 'Name',
      );
      nameHeader?.click();
      fixture.detectChanges();

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      expect(stored.sortActive).toBe('name');
      expect(stored.sortDirection).toBe('asc');
    });

    it('should persist page changes when the paginator is used', async () => {
      const cars = Array.from({ length: 15 }, (_, i) => buildCar({ id: `${i}` }));
      fixture = setup(fixedRepository(of(cars)));
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
