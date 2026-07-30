import { TestBed } from '@angular/core/testing';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { isObservable } from 'rxjs';

import { Firebase } from './firebase';
import { environment } from '../../../environments/environment';

// NOTE: `@angular/fire/firestore`'s exports are non-configurable ESM bindings in this
// project's Vitest setup — neither `vi.mock` (a partial mock that re-imports the same
// module from inside its own factory hits a circular hoisting bug specific to this
// builder) nor `vi.spyOn` (fails outright with "Module namespace is not configurable
// in ESM") can intercept `collectionData`/`docData`/`addDoc`/`updateDoc`/`deleteDoc`
// here. Deeper delegation/laziness testing of those calls isn't achievable without
// refactoring this service to inject the SDK functions through an indirection layer
// purely for test convenience, which wasn't warranted. These tests instead verify
// everything that's actually observable from the outside: real (offline, unmocked)
// reference construction, and the public Observable-based contract of every method.
describe('Firebase', () => {
  let service: Firebase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore()),
      ],
    });
    service = TestBed.inject(Firebase);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose the underlying Firestore instance', () => {
    expect(service.getFirestore()).toBeTruthy();
  });

  it('should build a collection reference for a path', () => {
    const ref = service.collection('cars');
    expect(ref.path).toBe('cars');
  });

  it('should build distinct collection references for distinct paths', () => {
    expect(service.collection('cars').path).toBe('cars');
    expect(service.collection('dealerships').path).toBe('dealerships');
  });

  it('should build a document reference for a path and id', () => {
    const ref = service.doc('cars', 'abc123');
    expect(ref.path).toBe('cars/abc123');
  });

  it('should build distinct document references for distinct ids under the same path', () => {
    expect(service.doc('cars', 'abc123').path).toBe('cars/abc123');
    expect(service.doc('cars', 'def456').path).toBe('cars/def456');
  });

  it('should return an Observable from collection$', () => {
    expect(isObservable(service.collection$('cars'))).toBe(true);
  });

  it('should return an Observable from doc$', () => {
    expect(isObservable(service.doc$('cars', 'abc123'))).toBe(true);
  });

  it('should return an Observable from add', () => {
    expect(isObservable(service.add('cars', { make: 'Toyota' }))).toBe(true);
  });

  it('should return an Observable from update', () => {
    expect(isObservable(service.update('cars', 'abc123', { make: 'Honda' }))).toBe(true);
  });

  it('should return an Observable from remove', () => {
    expect(isObservable(service.remove('cars', 'abc123'))).toBe(true);
  });
});
