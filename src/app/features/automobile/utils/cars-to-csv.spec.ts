import { carsToCsv } from './cars-to-csv';
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

describe('carsToCsv', () => {
  it('should return only the header row for an empty list', () => {
    expect(carsToCsv([])).toBe(
      'Make,Model,Year,VIN,Color,Mileage,Price,Status,Origin,Cylinders,MPG,Horsepower,Weight',
    );
  });

  it('should render one CRLF-delimited row per car', () => {
    const cars = [
      buildCar({ id: '1', make: 'Toyota', model: 'Corolla' }),
      buildCar({ id: '2', make: 'Honda', model: 'Civic' }),
    ];

    const csv = carsToCsv(cars);
    const lines = csv.split('\r\n');

    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('Toyota,Corolla');
    expect(lines[2]).toContain('Honda,Civic');
  });

  it('should render every field in the documented column order', () => {
    const car = buildCar({
      id: '1',
      make: 'Toyota',
      model: 'Corolla',
      year: 2024,
      vin: 'VIN123',
      color: 'Blue',
      mileage: 5000,
      price: 25000,
      status: 'available',
      origin: 'Japan',
      cylinders: 4,
      mpg: 32,
      horsepower: 150,
      weight: 2900,
    });

    const [, row] = carsToCsv([car]).split('\r\n');

    expect(row).toBe('Toyota,Corolla,2024,VIN123,Blue,5000,25000,available,Japan,4,32,150,2900');
  });

  it('should quote and escape fields containing commas or quotes', () => {
    const car = buildCar({ id: '1', make: 'Toyota', color: 'Red, "Sport" Edition' });

    const [, row] = carsToCsv([car]).split('\r\n');

    expect(row).toContain('"Red, ""Sport"" Edition"');
  });

  it('should quote fields containing newlines', () => {
    const car = buildCar({ id: '1', color: 'Two\nTone' });

    const [, row] = carsToCsv([car]).split('\r\n');

    expect(row).toContain('"Two\nTone"');
  });
});
