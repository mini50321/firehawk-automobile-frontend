import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { AutomobileRepository, hasSearchMpgConflict } from './automobile-repository';
import { Api } from '../../../core/services/api';
import { Car } from '../models/car.model';
import { EMPTY_CAR_FILTER_CRITERIA } from '../models/car-filter-criteria.model';

function buildCar(overrides: Partial<Car> & Pick<Car, 'id'>): Car {
  return {
    name: 'chevrolet chevelle malibu',
    mpg: 18,
    cylinders: 8,
    displacement: 307,
    horsepower: 130,
    weight: 3504,
    acceleration: 12,
    modelYear: 1970,
    origin: 'usa',
    ...overrides,
  };
}

describe('AutomobileRepository', () => {
  let repository: AutomobileRepository;
  let api: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    buildUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      get: vi.fn(),
      post: vi.fn(),
      buildUrl: vi.fn().mockReturnValue('https://api.example.com/cars/export?origin=usa'),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Api, useValue: api }],
    });

    repository = TestBed.inject(AutomobileRepository);
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  describe('getCars', () => {
    it('fetches a single page when the backend reports no more results', async () => {
      const car = buildCar({ id: '1' });
      api.get.mockReturnValue(of({ data: [car], nextCursor: null, hasMore: false }));

      const cars = await firstValueFrom(repository.getCars());

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/cars', { limit: 100 });
      expect(cars).toEqual([car]);
    });

    it('loops the cursor until hasMore is false, assembling every page', async () => {
      const carA = buildCar({ id: 'a' });
      const carB = buildCar({ id: 'b' });
      api.get
        .mockReturnValueOnce(of({ data: [carA], nextCursor: 'a', hasMore: true }))
        .mockReturnValueOnce(of({ data: [carB], nextCursor: null, hasMore: false }));

      const cars = await firstValueFrom(repository.getCars());

      expect(api.get).toHaveBeenCalledTimes(2);
      expect(api.get).toHaveBeenNthCalledWith(1, '/cars', { limit: 100 });
      expect(api.get).toHaveBeenNthCalledWith(2, '/cars', { cursor: 'a', limit: 100 });
      expect(cars).toEqual([carA, carB]);
    });

    it('maps filter criteria to the matching backend query params', async () => {
      api.get.mockReturnValue(of({ data: [], nextCursor: null, hasMore: false }));

      await firstValueFrom(
        repository.getCars({
          ...EMPTY_CAR_FILTER_CRITERIA,
          search: '  civic  ',
          origin: 'japan',
          cylinders: 4,
        }),
      );

      expect(api.get).toHaveBeenCalledWith('/cars', {
        q: 'civic',
        origin: 'japan',
        cylinders: 4,
        limit: 100,
      });
    });

    it('maps an MPG range to minMpg/maxMpg when there is no text search', async () => {
      api.get.mockReturnValue(of({ data: [], nextCursor: null, hasMore: false }));

      await firstValueFrom(
        repository.getCars({ ...EMPTY_CAR_FILTER_CRITERIA, mpg: { min: 20, max: 35 } }),
      );

      expect(api.get).toHaveBeenCalledWith('/cars', { minMpg: 20, maxMpg: 35, limit: 100 });
    });

    it('maps sort params to sortBy/sortOrder', async () => {
      api.get.mockReturnValue(of({ data: [], nextCursor: null, hasMore: false }));

      await firstValueFrom(
        repository.getCars(EMPTY_CAR_FILTER_CRITERIA, { sortBy: 'mpg', sortOrder: 'desc' }),
      );

      expect(api.get).toHaveBeenCalledWith('/cars', {
        sortBy: 'mpg',
        sortOrder: 'desc',
        limit: 100,
      });
    });

    describe('when a text search and an MPG range are combined', () => {
      // Firestore allows only one range filter per query — `q` (a prefix range on `name`) and an
      // MPG range both need one, so the backend rejects that combination with a 400. Regression
      // test for that: getCars must query by search alone and apply the MPG range itself, never
      // surfacing the conflict to the caller.
      it('queries the backend by search only, omitting minMpg/maxMpg', async () => {
        api.get.mockReturnValue(of({ data: [], nextCursor: null, hasMore: false }));

        await firstValueFrom(
          repository.getCars({
            ...EMPTY_CAR_FILTER_CRITERIA,
            search: 'civic',
            mpg: { min: 20, max: 35 },
          }),
        );

        expect(api.get).toHaveBeenCalledWith('/cars', { q: 'civic', limit: 100 });
      });

      it('applies the MPG range client-side over the search results', async () => {
        const inRange = buildCar({ id: '1', name: 'honda civic', mpg: 30 });
        const belowRange = buildCar({ id: '2', name: 'honda civic wagon', mpg: 10 });
        const aboveRange = buildCar({ id: '3', name: 'honda civic si', mpg: 40 });
        api.get.mockReturnValue(
          of({ data: [inRange, belowRange, aboveRange], nextCursor: null, hasMore: false }),
        );

        const cars = await firstValueFrom(
          repository.getCars({
            ...EMPTY_CAR_FILTER_CRITERIA,
            search: 'civic',
            mpg: { min: 20, max: 35 },
          }),
        );

        expect(cars).toEqual([inRange]);
      });
    });
  });

  describe('hasSearchMpgConflict', () => {
    it('is true only when both a search term and at least one MPG bound are set', () => {
      expect(
        hasSearchMpgConflict({ ...EMPTY_CAR_FILTER_CRITERIA, search: 'civic', mpg: { min: 20, max: null } }),
      ).toBe(true);
      expect(hasSearchMpgConflict({ ...EMPTY_CAR_FILTER_CRITERIA, search: 'civic' })).toBe(false);
      expect(
        hasSearchMpgConflict({ ...EMPTY_CAR_FILTER_CRITERIA, mpg: { min: 20, max: null } }),
      ).toBe(false);
      expect(hasSearchMpgConflict(EMPTY_CAR_FILTER_CRITERIA)).toBe(false);
    });
  });

  describe('getCarById', () => {
    it('fetches a single car by id', async () => {
      const car = buildCar({ id: '1' });
      api.get.mockReturnValue(of(car));

      const result = await firstValueFrom(repository.getCarById('1'));

      expect(api.get).toHaveBeenCalledWith('/cars/1');
      expect(result).toEqual(car);
    });
  });

  describe('createCar', () => {
    it('posts to /cars with the admin key as a header', async () => {
      const created = buildCar({ id: 'new-1' });
      api.post.mockReturnValue(of(created));
      const { id: _id, ...payload } = created;

      const result = await firstValueFrom(repository.createCar(payload, 'secret-key'));

      expect(api.post).toHaveBeenCalledWith('/cars', payload, {
        headers: { 'X-Admin-Key': 'secret-key' },
      });
      expect(result).toEqual(created);
    });
  });

  describe('buildExportUrl', () => {
    it('builds the export URL with the same filter/sort params as getCars', () => {
      const url = repository.buildExportUrl(
        { ...EMPTY_CAR_FILTER_CRITERIA, origin: 'usa' },
        { sortBy: 'mpg', sortOrder: 'asc' },
      );

      expect(api.buildUrl).toHaveBeenCalledWith('/cars/export', {
        origin: 'usa',
        sortBy: 'mpg',
        sortOrder: 'asc',
      });
      expect(url).toBe('https://api.example.com/cars/export?origin=usa');
    });
  });
});
