import { calculateCarStats } from './car-stats';
import { Car } from '../models/car.model';

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
    mpg: 30,
    horsepower: 140,
    weight: 3000,
    ...overrides,
  };
}

describe('calculateCarStats', () => {
  it('should return all zeros for an empty list', () => {
    expect(calculateCarStats([])).toEqual({
      totalCount: 0,
      averageMpg: 0,
      averageHorsepower: 0,
      averageWeight: 0,
    });
  });

  it('should return the car itself as the averages for a single car', () => {
    const car = buildCar({ id: '1', mpg: 32, horsepower: 150, weight: 2900 });

    expect(calculateCarStats([car])).toEqual({
      totalCount: 1,
      averageMpg: 32,
      averageHorsepower: 150,
      averageWeight: 2900,
    });
  });

  it('should compute the total count and averages across multiple cars', () => {
    const cars = [
      buildCar({ id: '1', mpg: 20, horsepower: 100, weight: 3000 }),
      buildCar({ id: '2', mpg: 30, horsepower: 200, weight: 4000 }),
      buildCar({ id: '3', mpg: 40, horsepower: 300, weight: 5000 }),
    ];

    expect(calculateCarStats(cars)).toEqual({
      totalCount: 3,
      averageMpg: 30,
      averageHorsepower: 200,
      averageWeight: 4000,
    });
  });

  it('should not round fractional averages', () => {
    const cars = [
      buildCar({ id: '1', mpg: 20, horsepower: 100, weight: 3000 }),
      buildCar({ id: '2', mpg: 21, horsepower: 101, weight: 3001 }),
    ];

    const stats = calculateCarStats(cars);

    expect(stats.averageMpg).toBeCloseTo(20.5);
    expect(stats.averageHorsepower).toBeCloseTo(100.5);
    expect(stats.averageWeight).toBeCloseTo(3000.5);
  });
});
