import { Car } from '../models/car.model';
import { CarFilterCriteria, NumberRange } from '../models/car-filter-criteria.model';

export function filterCars(cars: Car[], criteria: CarFilterCriteria): Car[] {
  const search = criteria.search.trim().toLowerCase();

  return cars.filter((car) => {
    if (search && !`${car.make} ${car.model}`.toLowerCase().includes(search)) {
      return false;
    }
    if (criteria.origin !== null && car.origin !== criteria.origin) {
      return false;
    }
    if (criteria.cylinders !== null && car.cylinders !== criteria.cylinders) {
      return false;
    }
    if (criteria.modelYear !== null && car.year !== criteria.modelYear) {
      return false;
    }
    if (!isInRange(car.mpg, criteria.mpg)) {
      return false;
    }
    if (!isInRange(car.horsepower, criteria.horsepower)) {
      return false;
    }
    if (!isInRange(car.weight, criteria.weight)) {
      return false;
    }

    return true;
  });
}

function isInRange(value: number, range: NumberRange): boolean {
  if (range.min !== null && value < range.min) {
    return false;
  }
  if (range.max !== null && value > range.max) {
    return false;
  }
  return true;
}
