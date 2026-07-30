import {
  AfterViewInit,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { catchError, map, merge, of, startWith } from 'rxjs';

import { AutomobileRepository } from '../../services/automobile-repository';
import { Car } from '../../models/car.model';
import {
  CarFilterCriteria,
  EMPTY_CAR_FILTER_CRITERIA,
} from '../../models/car-filter-criteria.model';
import { filterCars } from '../../utils/filter-cars';
import { carsToCsv } from '../../utils/cars-to-csv';
import { CarFilters } from '../car-filters/car-filters';
import { CarStats } from '../car-stats/car-stats';
import { CarTableViewStateStore } from '../../services/car-table-view-state-store';
import { FileDownload } from '../../../../core/services/file-download';
import { Feedback } from '../../../../core/services/feedback';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

type CarColumn =
  | 'make'
  | 'model'
  | 'year'
  | 'price'
  | 'color'
  | 'mileage'
  | 'vin'
  | 'status'
  | 'origin'
  | 'cylinders'
  | 'mpg'
  | 'horsepower'
  | 'weight';

interface CarsLoadState {
  loading: boolean;
  cars: Car[];
  error: string | null;
}

interface EmptyStateContent {
  icon: string;
  title: string;
  message: string;
}

const CORE_COLUMNS: CarColumn[] = ['make', 'model', 'year', 'price'];
const EXTENDED_COLUMNS: CarColumn[] = [
  'color',
  'mileage',
  'vin',
  'status',
  'origin',
  'cylinders',
  'mpg',
  'horsepower',
  'weight',
];

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

const INITIAL_STATE: CarsLoadState = { loading: true, cars: [], error: null };

const NO_CARS_YET: EmptyStateContent = {
  icon: 'directions_car',
  title: 'No automobiles yet',
  message: 'Automobiles you add will appear here.',
};

const NO_FILTER_MATCHES: EmptyStateContent = {
  icon: 'search_off',
  title: 'No automobiles match your filters',
  message: 'Try adjusting or resetting your filters.',
};

@Component({
  selector: 'app-car-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    DecimalPipe,
    CarFilters,
    CarStats,
    EmptyState,
  ],
  templateUrl: './car-table.html',
  styleUrl: './car-table.scss',
})
export class CarTable implements AfterViewInit {
  private readonly repository = inject(AutomobileRepository);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly viewState = inject(CarTableViewStateStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly fileDownload = inject(FileDownload);
  private readonly feedback = inject(Feedback);

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  protected readonly dataSource = new MatTableDataSource<Car>([]);

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);
  private readonly carFilters = viewChild.required(CarFilters);

  private readonly state = toSignal(
    this.repository.getCars().pipe(
      map((cars): CarsLoadState => ({ loading: false, cars, error: null })),
      startWith(INITIAL_STATE),
      catchError(() =>
        of<CarsLoadState>({ loading: false, cars: [], error: 'Failed to load automobiles.' }),
      ),
    ),
    { initialValue: INITIAL_STATE },
  );

  protected readonly cars = computed(() => this.state().cars);
  protected readonly loading = computed(() => this.state().loading);
  protected readonly error = computed(() => this.state().error);

  protected readonly filterCriteria = signal<CarFilterCriteria>(this.viewState.snapshot().filters);
  protected readonly hasActiveFilters = computed(
    () => JSON.stringify(this.filterCriteria()) !== JSON.stringify(EMPTY_CAR_FILTER_CRITERIA),
  );

  protected readonly filteredCars = computed(() => filterCars(this.cars(), this.filterCriteria()));

  protected readonly emptyState = computed<EmptyStateContent>(() => {
    const message = this.error();
    if (message) {
      return { icon: 'error_outline', title: 'Something went wrong', message };
    }
    return this.hasActiveFilters() ? NO_FILTER_MATCHES : NO_CARS_YET;
  });

  private readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly displayedColumns = computed<CarColumn[]>(() =>
    this.isHandset() ? CORE_COLUMNS : [...CORE_COLUMNS, ...EXTENDED_COLUMNS],
  );

  constructor() {
    this.dataSource.sortingDataAccessor = (car, columnId) => {
      const value = car[columnId as keyof Car];
      return typeof value === 'string' ? value.toLowerCase() : value;
    };

    effect(() => {
      this.dataSource.data = this.filteredCars();
    });
  }

  ngAfterViewInit(): void {
    const sort = this.sort();
    const paginator = this.paginator();

    this.dataSource.sort = sort;
    this.dataSource.paginator = paginator;

    // Deferred to a microtask: mutating `sort`/`paginator` synchronously here would
    // change host bindings (e.g. MatSortHeader's aria-sort) mid change-detection cycle
    // and trip NG0100. Re-attaching afterward makes MatTableDataSource recompute against
    // the restored values — plain property writes alone don't notify it.
    // The snapshot is read *inside* the callback (not captured beforehand) so that if
    // the user interacts with sort/paginator before this fires, we don't clobber it.
    Promise.resolve().then(() => {
      const restored = this.viewState.snapshot();
      sort.active = restored.sortActive;
      sort.direction = restored.sortDirection;
      paginator.pageIndex = Math.max(restored.pageIndex, 0);
      paginator.pageSize = this.pageSizeOptions.includes(restored.pageSize)
        ? restored.pageSize
        : PAGE_SIZE_OPTIONS[1];

      this.dataSource.sort = sort;
      this.dataSource.paginator = paginator;
    });

    merge(sort.sortChange, paginator.page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.viewState.updateSort(sort.active, sort.direction);
        this.viewState.updatePage(paginator.pageIndex, paginator.pageSize);
      });
  }

  protected async openDetails(car: Car): Promise<void> {
    const { CarDetailsDialog } = await import('../car-details-dialog/car-details-dialog');
    this.dialog.open(CarDetailsDialog, {
      data: car,
      width: '480px',
      maxWidth: '90vw',
    });
  }

  protected resetFilters(): void {
    this.carFilters().resetFilters();
    this.feedback.show('Filters reset.');
  }

  protected exportCsv(): void {
    const cars = this.filteredCars();
    if (cars.length === 0) {
      this.feedback.show('No automobiles to export.');
      return;
    }

    const csv = carsToCsv(cars);
    const filename = `automobiles-${new Date().toISOString().slice(0, 10)}.csv`;
    this.fileDownload.downloadTextFile(filename, csv, 'text/csv');
    this.feedback.show(`Exported ${cars.length} automobile${cars.length === 1 ? '' : 's'} to CSV.`);
  }
}
