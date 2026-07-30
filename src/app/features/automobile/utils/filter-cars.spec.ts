import { filterCars } from './filter-cars';
import { Car } from '../models/car.model';
import { CarFilterCriteria, EMPTY_CAR_FILTER_CRITERIA } from '../models/car-filter-criteria.model';

function buildCar(overrides: Partial<Car> & Pick<Car, 'id'>): Car {
  return {
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vin: '1HGCM82633A000000',
    color: 'Blue',
    mileage: 10000,
    price: 20000,
    status: 'available',
    origin: 'Japan',
    cylinders: 4,
    mpg: 32,
    horsepower: 140,
    weight: 2900,
    ...overrides,
  };
}

describe('filterCars', () => {
  const cars: Car[] = [
    buildCar({
      id: '1',
      make: 'Toyota',
      model: 'Corolla',
      origin: 'Japan',
      cylinders: 4,
      year: 2020,
      mpg: 32,
      horsepower: 140,
      weight: 2900,
    }),
    buildCar({
      id: '2',
      make: 'Ford',
      model: 'F-150',
      origin: 'USA',
      cylinders: 8,
      year: 2022,
      mpg: 18,
      horsepower: 400,
      weight: 5000,
    }),
    buildCar({
      id: '3',
      make: 'BMW',
      model: 'X5',
      origin: 'Germany',
      cylinders: 6,
      year: 2021,
      mpg: 24,
      horsepower: 335,
      weight: 4800,
    }),
  ];

  it('should return all cars when criteria is empty', () => {
    expect(filterCars(cars, EMPTY_CAR_FILTER_CRITERIA)).toEqual(cars);
  });

  it('should filter by search matching make or model, case-insensitively', () => {
    const criteria: CarFilterCriteria = { ...EMPTY_CAR_FILTER_CRITERIA, search: 'corolla' };
    expect(filterCars(cars, criteria)).toEqual([cars[0]]);
  });

  it('should trim whitespace from the search term', () => {
    const criteria: CarFilterCriteria = { ...EMPTY_CAR_FILTER_CRITERIA, search: '  f-150  ' };
    expect(filterCars(cars, criteria)).toEqual([cars[1]]);
  });

  it('should filter by origin', () => {
    const criteria: CarFilterCriteria = { ...EMPTY_CAR_FILTER_CRITERIA, origin: 'Germany' };
    expect(filterCars(cars, criteria)).toEqual([cars[2]]);
  });

  it('should filter by cylinders', () => {
    const criteria: CarFilterCriteria = { ...EMPTY_CAR_FILTER_CRITERIA, cylinders: 8 };
    expect(filterCars(cars, criteria)).toEqual([cars[1]]);
  });

  it('should filter by model year', () => {
    const criteria: CarFilterCriteria = { ...EMPTY_CAR_FILTER_CRITERIA, modelYear: 2021 };
    expect(filterCars(cars, criteria)).toEqual([cars[2]]);
  });

  it('should filter by MPG range (min and max)', () => {
    const criteria: CarFilterCriteria = {
      ...EMPTY_CAR_FILTER_CRITERIA,
      mpg: { min: 20, max: 30 },
    };
    expect(filterCars(cars, criteria)).toEqual([cars[2]]);
  });

  it('should filter by an open-ended horsepower range', () => {
    const criteria: CarFilterCriteria = {
      ...EMPTY_CAR_FILTER_CRITERIA,
      horsepower: { min: 300, max: null },
    };
    expect(filterCars(cars, criteria)).toEqual([cars[1], cars[2]]);
  });

  it('should filter by weight range', () => {
    const criteria: CarFilterCriteria = {
      ...EMPTY_CAR_FILTER_CRITERIA,
      weight: { min: null, max: 3000 },
    };
    expect(filterCars(cars, criteria)).toEqual([cars[0]]);
  });

  it('should combine multiple criteria with AND semantics', () => {
    const criteria: CarFilterCriteria = {
      ...EMPTY_CAR_FILTER_CRITERIA,
      origin: 'USA',
      cylinders: 4,
    };
    expect(filterCars(cars, criteria)).toEqual([]);
  });

  it('should return an empty array when nothing matches', () => {
    const criteria: CarFilterCriteria = { ...EMPTY_CAR_FILTER_CRITERIA, search: 'nonexistent' };
    expect(filterCars(cars, criteria)).toEqual([]);
  });

  it('should return an empty array when given an empty car list, regardless of criteria', () => {
    expect(filterCars([], EMPTY_CAR_FILTER_CRITERIA)).toEqual([]);
    expect(filterCars([], { ...EMPTY_CAR_FILTER_CRITERIA, search: 'anything' })).toEqual([]);
  });

  it('should match when the search term only appears in the model, not the make', () => {
    const criteria: CarFilterCriteria = { ...EMPTY_CAR_FILTER_CRITERIA, search: 'x5' };
    expect(filterCars(cars, criteria)).toEqual([cars[2]]);
  });

  it('should treat range boundaries as inclusive on the minimum', () => {
    // cars[2] has mpg 24; a min of exactly 24 should still match.
    const criteria: CarFilterCriteria = {
      ...EMPTY_CAR_FILTER_CRITERIA,
      mpg: { min: 24, max: null },
    };
    expect(filterCars(cars, criteria)).toEqual([cars[0], cars[2]]);
  });

  it('should treat range boundaries as inclusive on the maximum', () => {
    // cars[2] has mpg 24; a max of exactly 24 should still match.
    const criteria: CarFilterCriteria = {
      ...EMPTY_CAR_FILTER_CRITERIA,
      mpg: { min: null, max: 24 },
    };
    expect(filterCars(cars, criteria)).toEqual([cars[1], cars[2]]);
  });

  it('should exclude a car just outside an inclusive boundary', () => {
    const criteria: CarFilterCriteria = {
      ...EMPTY_CAR_FILTER_CRITERIA,
      mpg: { min: 25, max: null },
    };
    expect(filterCars(cars, criteria)).toEqual([cars[0]]);
  });

  it('should combine multiple range filters (MPG and horsepower) with AND semantics', () => {
    const criteria: CarFilterCriteria = {
      ...EMPTY_CAR_FILTER_CRITERIA,
      mpg: { min: 20, max: null },
      horsepower: { min: 300, max: null },
    };
    expect(filterCars(cars, criteria)).toEqual([cars[2]]);
  });
});
