import { Component, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Origin } from '../../models/car.model';
import { CYLINDER_OPTIONS, ORIGIN_OPTIONS } from '../../models/car-options.model';
import { CarFilterCriteria } from '../../models/car-filter-criteria.model';
import { CarTableViewStateStore } from '../../services/car-table-view-state-store';

const SEARCH_DEBOUNCE_MS = 250;

interface CarFiltersFormValue {
  search: string | null;
  origin: Origin | null;
  cylinders: number | null;
  mpgMin: number | null;
  mpgMax: number | null;
}

function toCriteria(value: Partial<CarFiltersFormValue>): CarFilterCriteria {
  return {
    search: value.search ?? '',
    origin: value.origin ?? null,
    cylinders: value.cylinders ?? null,
    mpg: { min: value.mpgMin ?? null, max: value.mpgMax ?? null },
  };
}

function toFormValue(criteria: CarFilterCriteria): CarFiltersFormValue {
  return {
    search: criteria.search,
    origin: criteria.origin,
    cylinders: criteria.cylinders,
    mpgMin: criteria.mpg.min,
    mpgMax: criteria.mpg.max,
  };
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
  readonly filtersChange = output<CarFilterCriteria>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly viewState = inject(CarTableViewStateStore);

  protected readonly originOptions = ORIGIN_OPTIONS;
  protected readonly cylinderOptions = CYLINDER_OPTIONS;

  protected readonly form = this.formBuilder.group({
    search: this.formBuilder.control(''),
    origin: this.formBuilder.control<Origin | null>(null),
    cylinders: this.formBuilder.control<number | null>(null),
    mpgMin: this.formBuilder.control<number | null>(null),
    mpgMax: this.formBuilder.control<number | null>(null),
  });

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

  /** Public: called both from this component's own template and externally by CarTable's empty-state action. */
  resetFilters(): void {
    this.form.reset();
  }
}
