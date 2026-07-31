import { Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { Car } from '../../models/car.model';
import { calculateCarStats } from '../../utils/car-stats';

@Component({
  selector: 'app-car-stats',
  imports: [MatCardModule, CurrencyPipe, DecimalPipe],
  templateUrl: './car-stats.html',
  styleUrl: './car-stats.scss',
})
export class CarStats {
  readonly cars = input.required<Car[]>();

  protected readonly stats = computed(() => calculateCarStats(this.cars()));
}
