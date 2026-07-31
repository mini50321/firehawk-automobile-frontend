import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { AutomobileRepository } from './automobile-repository';
import { Api } from '../../../core/services/api';
import { Car } from '../models/car.model';
import { EMPTY_CAR_FILTER_CRITERIA } from '../models/car-filter-criteria.model';

function buildCar(overrides: Partial<Car> & Pick<Car, 'id'>): Car {
  return {
    symboling: 0,
    normalizedLosses: 100,
    make: 'toyota',
    fuelType: 'gas',
    aspiration: 'std',
    numOfDoors: 4,
    bodyStyle: 'sedan',
    driveWheels: 'fwd',
    engineLocation: 'front',
    wheelBase: 95,
    length: 170,
    width: 65,
    height: 55,
    curbWeight: 2200,
    engineType: 'ohc',
    numOfCylinders: 4,
    engineSize: 120,
    fuelSystem: 'mpfi',
    bore: 3.2,
    stroke: 3.1,
    compressionRatio: 9.5,
    horsepower: 100,
    peakRpm: 5000,
    cityMpg: 25,
    highwayMpg: 30,
    price: 15000,
    ...overrides,
  };
}

describe('AutomobileRepository', () => {
  let repository: AutomobileRepository;
  let api: {
    get: ReturnType<typeof vi.fn>;
    buildUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      get: vi.fn(),
      buildUrl: vi.fn().mockReturnValue('https://api.example.com/cars/export?fuelType=gas'),
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
          fuelType: 'gas',
          bodyStyle: 'sedan',
          price: { min: 5000, max: 20000 },
        }),
      );

      expect(api.get).toHaveBeenCalledWith('/cars', {
        q: 'civic',
        fuelType: 'gas',
        bodyStyle: 'sedan',
        minPrice: 5000,
        maxPrice: 20000,
        limit: 100,
      });
    });

    it('maps sort params to sortBy/sortOrder', async () => {
      api.get.mockReturnValue(of({ data: [], nextCursor: null, hasMore: false }));

      await firstValueFrom(
        repository.getCars(EMPTY_CAR_FILTER_CRITERIA, { sortBy: 'price', sortOrder: 'desc' }),
      );

      expect(api.get).toHaveBeenCalledWith('/cars', {
        sortBy: 'price',
        sortOrder: 'desc',
        limit: 100,
      });
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

  describe('buildExportUrl', () => {
    it('builds the export URL with the same filter/sort params as getCars', () => {
      const url = repository.buildExportUrl(
        { ...EMPTY_CAR_FILTER_CRITERIA, fuelType: 'gas' },
        { sortBy: 'price', sortOrder: 'asc' },
      );

      expect(api.buildUrl).toHaveBeenCalledWith('/cars/export', {
        fuelType: 'gas',
        sortBy: 'price',
        sortOrder: 'asc',
      });
      expect(url).toBe('https://api.example.com/cars/export?fuelType=gas');
    });
  });
});
