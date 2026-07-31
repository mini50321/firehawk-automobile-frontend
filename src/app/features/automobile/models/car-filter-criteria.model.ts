import { Aspiration, BodyStyle, DriveWheels, EngineLocation, FuelType } from './car.model';

export interface NumberRange {
  min: number | null;
  max: number | null;
}

/**
 * Every field here maps 1:1 to a query param the backend's `/cars/search` endpoint actually
 * supports (see backend/src/models/automobile.model.ts) — this UI deliberately doesn't offer a
 * filter the server can't apply.
 */
export interface CarFilterCriteria {
  /** Maps to `q` — a case-insensitive prefix match on `make`. */
  search: string;
  fuelType: FuelType | null;
  aspiration: Aspiration | null;
  bodyStyle: BodyStyle | null;
  driveWheels: DriveWheels | null;
  engineLocation: EngineLocation | null;
  /** Maps to `minPrice`/`maxPrice`. */
  price: NumberRange;
}

export const EMPTY_CAR_FILTER_CRITERIA: CarFilterCriteria = {
  search: '',
  fuelType: null,
  aspiration: null,
  bodyStyle: null,
  driveWheels: null,
  engineLocation: null,
  price: { min: null, max: null },
};
