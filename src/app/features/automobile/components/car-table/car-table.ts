import { AfterViewInit, Component, computed, effect, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { catchError, map, of, startWith } from 'rxjs';

import { AutomobileRepository } from '../../services/automobile-repository';
import { Car } from '../../models/car.model';

type CarColumn = 'make' | 'model' | 'year' | 'color' | 'mileage' | 'price' | 'vin' | 'status';

interface CarsLoadState {
  loading: boolean;
  cars: Car[];
  error: string | null;
}

const CORE_COLUMNS: CarColumn[] = ['make', 'model', 'year', 'price'];
const EXTENDED_COLUMNS: CarColumn[] = ['color', 'mileage', 'vin', 'status'];

const INITIAL_STATE: CarsLoadState = { loading: true, cars: [], error: null };

@Component({
  selector: 'app-car-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressBarModule,
    CurrencyPipe,
    DecimalPipe,
  ],
  templateUrl: './car-table.html',
  styleUrl: './car-table.scss',
})
export class CarTable implements AfterViewInit {
  private readonly repository = inject(AutomobileRepository);
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly dataSource = new MatTableDataSource<Car>([]);

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

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

  protected readonly loading = computed(() => this.state().loading);
  protected readonly error = computed(() => this.state().error);

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
      this.dataSource.data = this.state().cars;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }
}
