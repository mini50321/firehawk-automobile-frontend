import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Firebase } from '../../../core/services/firebase';
import { Car } from '../models/car.model';

const CARS_COLLECTION = 'cars';

@Injectable({
  providedIn: 'root',
})
export class AutomobileRepository {
  private readonly firebase = inject(Firebase);

  getCars(): Observable<Car[]> {
    return this.firebase.collection$<Car>(CARS_COLLECTION);
  }

  getCarById(id: string): Observable<Car | undefined> {
    return this.firebase.doc$<Car>(CARS_COLLECTION, id);
  }

  addCar(car: Omit<Car, 'id'>): Observable<string> {
    return this.firebase.add(CARS_COLLECTION, car);
  }

  updateCar(id: string, changes: Partial<Omit<Car, 'id'>>): Observable<void> {
    return this.firebase.update<Car>(CARS_COLLECTION, id, changes);
  }

  deleteCar(id: string): Observable<void> {
    return this.firebase.remove(CARS_COLLECTION, id);
  }
}
