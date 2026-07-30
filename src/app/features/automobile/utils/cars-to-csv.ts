import { Car } from '../models/car.model';

const CSV_HEADERS = [
  'Make',
  'Model',
  'Year',
  'VIN',
  'Color',
  'Mileage',
  'Price',
  'Status',
  'Origin',
  'Cylinders',
  'MPG',
  'Horsepower',
  'Weight',
];

function escapeCsvField(value: string | number): string {
  const str = String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function carToRow(car: Car): string {
  return [
    car.make,
    car.model,
    car.year,
    car.vin,
    car.color,
    car.mileage,
    car.price,
    car.status,
    car.origin,
    car.cylinders,
    car.mpg,
    car.horsepower,
    car.weight,
  ]
    .map(escapeCsvField)
    .join(',');
}

export function carsToCsv(cars: Car[]): string {
  return [CSV_HEADERS.join(','), ...cars.map(carToRow)].join('\r\n');
}
