import { carsToCsv } from './cars-to-csv';
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

describe('carsToCsv', () => {
  it('returns just the header row for an empty list', () => {
    expect(carsToCsv([])).toBe(
      'id,name,mpg,cylinders,displacement,horsepower,weight,acceleration,modelYear,origin',
    );
  });

  it('renders every field of a car as a CSV row in the backend column order', () => {
    const car = buildCar({ id: '1' });

    const csv = carsToCsv([car]);
    const lines = csv.split('\r\n');

    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('1,chevrolet chevelle malibu,18,8,307,130,3504,12,1970,usa');
  });

  it('renders a null horsepower as an empty field', () => {
    const csv = carsToCsv([buildCar({ id: '1', horsepower: null })]);
    const [, row] = csv.split('\r\n');

    expect(row).toBe('1,chevrolet chevelle malibu,18,8,307,,3504,12,1970,usa');
  });

  it('quotes and escapes a name containing a comma', () => {
    const csv = carsToCsv([buildCar({ id: '1', name: 'car, deluxe' })]);
    const [, row] = csv.split('\r\n');

    expect(row).toBe('1,"car, deluxe",18,8,307,130,3504,12,1970,usa');
  });
});
