export type CarStatus = 'available' | 'reserved' | 'sold' | 'in-service';

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
}
