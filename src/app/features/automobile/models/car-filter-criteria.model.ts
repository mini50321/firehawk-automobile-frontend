import { Origin } from './car.model';

export interface NumberRange {
  min: number | null;
  max: number | null;
}

/**
 * Every field here maps 1:1 to a query param the backend's `/cars` endpoint actually supports
 * (see backend/src/models/automobile.model.ts) — this UI deliberately doesn't offer a filter the
 * server can't apply.
 */
export interface CarFilterCriteria {
  /** Maps to `q` — a case-insensitive prefix match on `name`. */
  search: string;
  origin: Origin | null;
  cylinders: number | null;
  /** Maps to `minMpg`/`maxMpg`. */
  mpg: NumberRange;
}

export const EMPTY_CAR_FILTER_CRITERIA: CarFilterCriteria = {
  search: '',
  origin: null,
  cylinders: null,
  mpg: { min: null, max: null },
};
