export type CarStatus = 'available' | 'reserved' | 'sold' | 'in-service';

export type CarOrigin = 'USA' | 'Germany' | 'Japan' | 'South Korea' | 'Other';

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  mileage: number;
  price: number;
  status: CarStatus;
  origin: CarOrigin;
  cylinders: number;
  /** Fuel economy, miles per gallon (combined). */
  mpg: number;
  horsepower: number;
  /** Curb weight in lbs. */
  weight: number;
}
