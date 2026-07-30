import { Component, computed, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Car, CarOrigin } from '../../models/car.model';
import { CarFilterCriteria } from '../../models/car-filter-criteria.model';
import { CarTableViewStateStore } from '../../services/car-table-view-state-store';

const SEARCH_DEBOUNCE_MS = 250;

interface CarFiltersFormValue {
  search: string | null;
  origin: CarOrigin | null;
  cylinders: number | null;
  modelYear: number | null;
  mpgMin: number | null;
  mpgMax: number | null;
  horsepowerMin: number | null;
  horsepowerMax: number | null;
  weightMin: number | null;
  weightMax: number | null;
}

function toCriteria(value: Partial<CarFiltersFormValue>): CarFilterCriteria {
  return {
    search: value.search ?? '',
    origin: value.origin ?? null,
    cylinders: value.cylinders ?? null,
    modelYear: value.modelYear ?? null,
    mpg: { min: value.mpgMin ?? null, max: value.mpgMax ?? null },
    horsepower: { min: value.horsepowerMin ?? null, max: value.horsepowerMax ?? null },
    weight: { min: value.weightMin ?? null, max: value.weightMax ?? null },
  };
}

function toFormValue(criteria: CarFilterCriteria): CarFiltersFormValue {
  return {
    search: criteria.search,
    origin: criteria.origin,
    cylinders: criteria.cylinders,
    modelYear: criteria.modelYear,
    mpgMin: criteria.mpg.min,
    mpgMax: criteria.mpg.max,
    horsepowerMin: criteria.horsepower.min,
    horsepowerMax: criteria.horsepower.max,
    weightMin: criteria.weight.min,
    weightMax: criteria.weight.max,
  };
}

function distinctSorted<T>(values: T[], compare?: (a: T, b: T) => number): T[] {
  return Array.from(new Set(values)).sort(compare);
}

@Component({
  selector: 'app-car-filters',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './car-filters.html',
  styleUrl: './car-filters.scss',
})
export class CarFilters {
  readonly cars = input.required<Car[]>();
  readonly filtersChange = output<CarFilterCriteria>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly viewState = inject(CarTableViewStateStore);

  protected readonly form = this.formBuilder.group({
    search: this.formBuilder.control(''),
    origin: this.formBuilder.control<CarOrigin | null>(null),
    cylinders: this.formBuilder.control<number | null>(null),
    modelYear: this.formBuilder.control<number | null>(null),
    mpgMin: this.formBuilder.control<number | null>(null),
    mpgMax: this.formBuilder.control<number | null>(null),
    horsepowerMin: this.formBuilder.control<number | null>(null),
    horsepowerMax: this.formBuilder.control<number | null>(null),
    weightMin: this.formBuilder.control<number | null>(null),
    weightMax: this.formBuilder.control<number | null>(null),
  });

  protected readonly origins = computed(() => distinctSorted(this.cars().map((car) => car.origin)));

  protected readonly cylinderOptions = computed(() =>
    distinctSorted(
      this.cars().map((car) => car.cylinders),
      (a, b) => a - b,
    ),
  );

  protected readonly modelYears = computed(() =>
    distinctSorted(
      this.cars().map((car) => car.year),
      (a, b) => a - b,
    ),
  );

  constructor() {
    // Seed the form from persisted state before wiring valueChanges, so the
    // debounced pipeline's initial emission reflects the restored values.
    this.form.reset(toFormValue(this.viewState.snapshot().filters));

    this.form.valueChanges
      .pipe(
        startWith(this.form.getRawValue()),
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        map((value) => toCriteria(value)),
        takeUntilDestroyed(),
      )
      .subscribe((criteria) => {
        this.filtersChange.emit(criteria);
        this.viewState.updateFilters(criteria);
      });
  }

  protected resetFilters(): void {
    this.form.reset();
  }
}
