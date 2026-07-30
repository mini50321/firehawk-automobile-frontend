import { Car } from '../models/car.model';
import { CarStats } from '../models/car-stats.model';

const EMPTY_STATS: CarStats = {
  totalCount: 0,
  averageMpg: 0,
  averageHorsepower: 0,
  averageWeight: 0,
};

export function calculateCarStats(cars: Car[]): CarStats {
  const totalCount = cars.length;
  if (totalCount === 0) {
    return EMPTY_STATS;
  }

  const sumBy = (selector: (car: Car) => number) =>
    cars.reduce((total, car) => total + selector(car), 0);

  return {
    totalCount,
    averageMpg: sumBy((car) => car.mpg) / totalCount,
    averageHorsepower: sumBy((car) => car.horsepower) / totalCount,
    averageWeight: sumBy((car) => car.weight) / totalCount,
  };
}
