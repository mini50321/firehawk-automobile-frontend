import { Car } from '../models/car.model';

// Mirrors the backend's CSV_COLUMNS order (backend/src/controllers/automobile.controller.ts) so
// a client-generated export (see hasSearchMpgConflict's fallback) looks identical to the
// server-streamed one.
const CSV_COLUMNS: Array<keyof Car> = [
  'id',
  'name',
  'mpg',
  'cylinders',
  'displacement',
  'horsepower',
  'weight',
  'acceleration',
  'modelYear',
  'origin',
];

function escapeCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function carsToCsv(cars: Car[]): string {
  const header = CSV_COLUMNS.join(',');
  const rows = cars.map((car) =>
    CSV_COLUMNS.map((column) => escapeCsvField(String(car[column] ?? ''))).join(','),
  );
  return [header, ...rows].join('\r\n');
}
