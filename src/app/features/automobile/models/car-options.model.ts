import { ORIGINS, Origin } from './car.model';

// Fixed enum straight from the backend's Automobile model, shared between CarFilters and CarForm
// so the two never drift out of sync with each other or with what the backend actually accepts.
export const ORIGIN_OPTIONS: Origin[] = [...ORIGINS];

// The dataset's own cylinder counts (3, 4, 5, 6, 8) — offered as a convenience filter dropdown.
// The add-a-car form leaves cylinders as a free-entry number instead, since a future addition
// isn't guaranteed to match one of these existing values.
export const CYLINDER_OPTIONS: number[] = [3, 4, 5, 6, 8];
