// Mirrors the backend's Automobile model exactly (backend/src/models/automobile.model.ts) — the
// "Auto MPG" dataset (Kaggle's tawfikelmetwally/automobile-dataset): technical/fuel-economy
// characteristics of a car model, not an individual-vehicle inventory record.

export const ORIGINS = ['usa', 'europe', 'japan'] as const;
export type Origin = (typeof ORIGINS)[number];

export interface Car {
  id: string;
  name: string;
  mpg: number;
  cylinders: number;
  displacement: number;
  horsepower: number | null;
  weight: number;
  acceleration: number;
  modelYear: number;
  origin: Origin;
}
