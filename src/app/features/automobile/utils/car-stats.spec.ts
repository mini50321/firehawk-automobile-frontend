import { calculateCarStats } from './car-stats';
import { Car } from '../models/car.model';

function buildCar(overrides: Partial<Car> & Pick<Car, 'id'>): Car {
  return {
    name: 'chevrolet chevelle malibu',
    mpg: 18,
    cylinders: 8,
    displacement: 307,
    horsepower: 130,
    weight: 3504,
    acceleration: 12,
    modelYear: 1970,
    origin: 'usa',
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
    const car = buildCar({ id: '1', mpg: 22, horsepower: 150, weight: 2800 });

    expect(calculateCarStats([car])).toEqual({
      totalCount: 1,
      averageMpg: 22,
      averageHorsepower: 150,
      averageWeight: 2800,
    });
  });

  it('should compute the total count and averages across multiple cars', () => {
    const cars = [
      buildCar({ id: '1', mpg: 10, horsepower: 100, weight: 2000 }),
      buildCar({ id: '2', mpg: 20, horsepower: 200, weight: 3000 }),
      buildCar({ id: '3', mpg: 30, horsepower: 300, weight: 4000 }),
    ];

    expect(calculateCarStats(cars)).toEqual({
      totalCount: 3,
      averageMpg: 20,
      averageHorsepower: 200,
      averageWeight: 3000,
    });
  });

  it('should not round fractional averages', () => {
    const cars = [
      buildCar({ id: '1', mpg: 10, horsepower: 100, weight: 2000 }),
      buildCar({ id: '2', mpg: 11, horsepower: 101, weight: 2001 }),
    ];

    const stats = calculateCarStats(cars);

    expect(stats.averageMpg).toBeCloseTo(10.5);
    expect(stats.averageHorsepower).toBeCloseTo(100.5);
    expect(stats.averageWeight).toBeCloseTo(2000.5);
  });

  it('should exclude a null horsepower from its average rather than treating it as zero', () => {
    const cars = [
      buildCar({ id: '1', horsepower: null, mpg: 20 }),
      buildCar({ id: '2', horsepower: 200, mpg: 30 }),
    ];

    const stats = calculateCarStats(cars);

    expect(stats.totalCount).toBe(2);
    expect(stats.averageHorsepower).toBe(200);
    expect(stats.averageMpg).toBe(25);
  });
});
