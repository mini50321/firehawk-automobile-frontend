import { CarOrigin } from './car.model';

export interface NumberRange {
  min: number | null;
  max: number | null;
}

export interface CarFilterCriteria {
  /** Matched against make + model, case-insensitive. */
  search: string;
  origin: CarOrigin | null;
  cylinders: number | null;
  modelYear: number | null;
  mpg: NumberRange;
  horsepower: NumberRange;
  weight: NumberRange;
}

export const EMPTY_CAR_FILTER_CRITERIA: CarFilterCriteria = {
  search: '',
  origin: null,
  cylinders: null,
  modelYear: null,
  mpg: { min: null, max: null },
  horsepower: { min: null, max: null },
  weight: { min: null, max: null },
};
