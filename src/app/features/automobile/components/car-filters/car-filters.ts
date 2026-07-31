import { Component, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import {
  Aspiration,
  BodyStyle,
  DriveWheels,
  EngineLocation,
  FuelType,
} from '../../models/car.model';
import { CarFilterCriteria } from '../../models/car-filter-criteria.model';
import { CarTableViewStateStore } from '../../services/car-table-view-state-store';

const SEARCH_DEBOUNCE_MS = 250;

// Fixed enums straight from the backend's Automobile model — unlike the old origin/cylinder/year
// dropdowns, these don't need to be derived from whatever data happens to be loaded.
const FUEL_TYPE_OPTIONS: FuelType[] = ['gas', 'diesel'];
const ASPIRATION_OPTIONS: Aspiration[] = ['std', 'turbo'];
const BODY_STYLE_OPTIONS: BodyStyle[] = ['hardtop', 'wagon', 'sedan', 'hatchback', 'convertible'];
const DRIVE_WHEELS_OPTIONS: DriveWheels[] = ['4wd', 'fwd', 'rwd'];
const ENGINE_LOCATION_OPTIONS: EngineLocation[] = ['front', 'rear'];

interface CarFiltersFormValue {
  search: string | null;
  fuelType: FuelType | null;
  aspiration: Aspiration | null;
  bodyStyle: BodyStyle | null;
  driveWheels: DriveWheels | null;
  engineLocation: EngineLocation | null;
  priceMin: number | null;
  priceMax: number | null;
}

function toCriteria(value: Partial<CarFiltersFormValue>): CarFilterCriteria {
  return {
    search: value.search ?? '',
    fuelType: value.fuelType ?? null,
    aspiration: value.aspiration ?? null,
    bodyStyle: value.bodyStyle ?? null,
    driveWheels: value.driveWheels ?? null,
    engineLocation: value.engineLocation ?? null,
    price: { min: value.priceMin ?? null, max: value.priceMax ?? null },
  };
}

function toFormValue(criteria: CarFilterCriteria): CarFiltersFormValue {
  return {
    search: criteria.search,
    fuelType: criteria.fuelType,
    aspiration: criteria.aspiration,
    bodyStyle: criteria.bodyStyle,
    driveWheels: criteria.driveWheels,
    engineLocation: criteria.engineLocation,
    priceMin: criteria.price.min,
    priceMax: criteria.price.max,
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

  protected readonly fuelTypeOptions = FUEL_TYPE_OPTIONS;
  protected readonly aspirationOptions = ASPIRATION_OPTIONS;
  protected readonly bodyStyleOptions = BODY_STYLE_OPTIONS;
  protected readonly driveWheelsOptions = DRIVE_WHEELS_OPTIONS;
  protected readonly engineLocationOptions = ENGINE_LOCATION_OPTIONS;

  protected readonly form = this.formBuilder.group({
    search: this.formBuilder.control(''),
    fuelType: this.formBuilder.control<FuelType | null>(null),
    aspiration: this.formBuilder.control<Aspiration | null>(null),
    bodyStyle: this.formBuilder.control<BodyStyle | null>(null),
    driveWheels: this.formBuilder.control<DriveWheels | null>(null),
    engineLocation: this.formBuilder.control<EngineLocation | null>(null),
    priceMin: this.formBuilder.control<number | null>(null),
    priceMax: this.formBuilder.control<number | null>(null),
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
