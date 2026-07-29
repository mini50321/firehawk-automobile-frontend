import { TestBed } from '@angular/core/testing';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { isObservable } from 'rxjs';

import { Firebase } from './firebase';
import { environment } from '../../../environments/environment';

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

  it('should build a document reference for a path and id', () => {
    const ref = service.doc('cars', 'abc123');
    expect(ref.path).toBe('cars/abc123');
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
