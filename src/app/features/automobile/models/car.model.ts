// Mirrors the backend's Automobile model exactly (backend/src/models/automobile.model.ts) —
// this is the classic UCI "Automobile" spec-sheet dataset (technical characteristics of a car
// model), not an individual-vehicle inventory record: no VIN, color, mileage, or status.

export type FuelType = 'gas' | 'diesel';
export type Aspiration = 'std' | 'turbo';
export type BodyStyle = 'hardtop' | 'wagon' | 'sedan' | 'hatchback' | 'convertible';
export type DriveWheels = '4wd' | 'fwd' | 'rwd';
export type EngineLocation = 'front' | 'rear';
export type EngineType = 'dohc' | 'dohcv' | 'l' | 'ohc' | 'ohcf' | 'ohcv' | 'rotor';
export type FuelSystem = '1bbl' | '2bbl' | '4bbl' | 'idi' | 'mfi' | 'mpfi' | 'spdi' | 'spfi';

export interface Car {
  id: string;
  symboling: number;
  normalizedLosses: number | null;
  make: string;
  fuelType: FuelType;
  aspiration: Aspiration;
  numOfDoors: 2 | 4 | null;
  bodyStyle: BodyStyle;
  driveWheels: DriveWheels;
  engineLocation: EngineLocation;
  wheelBase: number;
  length: number;
  width: number;
  height: number;
  curbWeight: number;
  engineType: EngineType;
  numOfCylinders: number;
  engineSize: number;
  fuelSystem: FuelSystem;
  bore: number | null;
  stroke: number | null;
  compressionRatio: number;
  horsepower: number | null;
  peakRpm: number | null;
  cityMpg: number;
  highwayMpg: number;
  price: number | null;
}
