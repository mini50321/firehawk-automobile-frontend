import { TestBed } from '@angular/core/testing';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

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
});
