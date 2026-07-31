import { Car } from '../models/car.model';
import { CarStats } from '../models/car-stats.model';

const EMPTY_STATS: CarStats = {
  totalCount: 0,
  averagePrice: 0,
  averageHorsepower: 0,
  averageCityMpg: 0,
};

/** Averages ignore nulls (price/horsepower can be missing in the source dataset) rather than
 *  treating them as zero, so a handful of missing values doesn't skew the average downward. */
function average(cars: Car[], selector: (car: Car) => number | null): number {
  const values = cars.map(selector).filter((value): value is number => value !== null);
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function calculateCarStats(cars: Car[]): CarStats {
  if (cars.length === 0) {
    return EMPTY_STATS;
  }

  return {
    totalCount: cars.length,
    averagePrice: average(cars, (car) => car.price),
    averageHorsepower: average(cars, (car) => car.horsepower),
    averageCityMpg: average(cars, (car) => car.cityMpg),
  };
}
