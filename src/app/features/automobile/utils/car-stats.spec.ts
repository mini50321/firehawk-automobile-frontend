import { calculateCarStats } from './car-stats';
import { Car } from '../models/car.model';

function buildCar(overrides: Partial<Car> & Pick<Car, 'id'>): Car {
  return {
    symboling: 0,
    normalizedLosses: 100,
    make: 'toyota',
    fuelType: 'gas',
    aspiration: 'std',
    numOfDoors: 4,
    bodyStyle: 'sedan',
    driveWheels: 'fwd',
    engineLocation: 'front',
    wheelBase: 95,
    length: 170,
    width: 65,
    height: 55,
    curbWeight: 2200,
    engineType: 'ohc',
    numOfCylinders: 4,
    engineSize: 120,
    fuelSystem: 'mpfi',
    bore: 3.2,
    stroke: 3.1,
    compressionRatio: 9.5,
    horsepower: 100,
    peakRpm: 5000,
    cityMpg: 25,
    highwayMpg: 30,
    price: 15000,
    ...overrides,
  };
}

describe('calculateCarStats', () => {
  it('should return all zeros for an empty list', () => {
    expect(calculateCarStats([])).toEqual({
      totalCount: 0,
      averagePrice: 0,
      averageHorsepower: 0,
      averageCityMpg: 0,
    });
  });

  it('should return the car itself as the averages for a single car', () => {
    const car = buildCar({ id: '1', price: 22000, horsepower: 150, cityMpg: 28 });

    expect(calculateCarStats([car])).toEqual({
      totalCount: 1,
      averagePrice: 22000,
      averageHorsepower: 150,
      averageCityMpg: 28,
    });
  });

  it('should compute the total count and averages across multiple cars', () => {
    const cars = [
      buildCar({ id: '1', price: 10000, horsepower: 100, cityMpg: 20 }),
      buildCar({ id: '2', price: 20000, horsepower: 200, cityMpg: 30 }),
      buildCar({ id: '3', price: 30000, horsepower: 300, cityMpg: 40 }),
    ];

    expect(calculateCarStats(cars)).toEqual({
      totalCount: 3,
      averagePrice: 20000,
      averageHorsepower: 200,
      averageCityMpg: 30,
    });
  });

  it('should not round fractional averages', () => {
    const cars = [
      buildCar({ id: '1', price: 10000, horsepower: 100, cityMpg: 20 }),
      buildCar({ id: '2', price: 10001, horsepower: 101, cityMpg: 21 }),
    ];

    const stats = calculateCarStats(cars);

    expect(stats.averagePrice).toBeCloseTo(10000.5);
    expect(stats.averageHorsepower).toBeCloseTo(100.5);
    expect(stats.averageCityMpg).toBeCloseTo(20.5);
  });

  it('should exclude null price/horsepower from their averages rather than treating them as zero', () => {
    const cars = [
      buildCar({ id: '1', price: null, horsepower: null, cityMpg: 20 }),
      buildCar({ id: '2', price: 20000, horsepower: 200, cityMpg: 30 }),
    ];

    const stats = calculateCarStats(cars);

    expect(stats.totalCount).toBe(2);
    expect(stats.averagePrice).toBe(20000);
    expect(stats.averageHorsepower).toBe(200);
    expect(stats.averageCityMpg).toBe(25);
  });
});
