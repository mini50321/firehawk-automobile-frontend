import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { AutomobileRepository } from './automobile-repository';
import { Firebase } from '../../../core/services/firebase';
import { Car } from '../models/car.model';

describe('AutomobileRepository', () => {
  let repository: AutomobileRepository;
  let firebase: {
    collection$: ReturnType<typeof vi.fn>;
    doc$: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const mockCarPayload: Omit<Car, 'id'> = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2024,
    vin: '1HGCM82633A004352',
    color: 'Blue',
    mileage: 12000,
    price: 22000,
    status: 'available',
  };
  const mockCar: Car = { id: '1', ...mockCarPayload };

  beforeEach(() => {
    firebase = {
      collection$: vi.fn().mockReturnValue(of([mockCar])),
      doc$: vi.fn().mockReturnValue(of(mockCar)),
      add: vi.fn().mockReturnValue(of('new-id')),
      update: vi.fn().mockReturnValue(of(undefined)),
      remove: vi.fn().mockReturnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Firebase, useValue: firebase }],
    });

    repository = TestBed.inject(AutomobileRepository);
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  it('should fetch all cars from the "cars" collection', async () => {
    const cars = await firstValueFrom(repository.getCars());
    expect(firebase.collection$).toHaveBeenCalledWith('cars');
    expect(cars).toEqual([mockCar]);
  });

  it('should fetch a single car by id', async () => {
    const car = await firstValueFrom(repository.getCarById('1'));
    expect(firebase.doc$).toHaveBeenCalledWith('cars', '1');
    expect(car).toEqual(mockCar);
  });

  it('should add a car', async () => {
    const newId = await firstValueFrom(repository.addCar(mockCarPayload));
    expect(firebase.add).toHaveBeenCalledWith('cars', mockCarPayload);
    expect(newId).toBe('new-id');
  });

  it('should update a car', async () => {
    await firstValueFrom(repository.updateCar('1', { price: 21000 }));
    expect(firebase.update).toHaveBeenCalledWith('cars', '1', { price: 21000 });
  });

  it('should delete a car', async () => {
    await firstValueFrom(repository.deleteCar('1'));
    expect(firebase.remove).toHaveBeenCalledWith('cars', '1');
  });
});
