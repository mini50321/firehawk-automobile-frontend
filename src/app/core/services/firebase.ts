import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  CollectionReference,
  DocumentReference,
  collection,
  doc,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class Firebase {
  private readonly firestore = inject(Firestore);

  getFirestore(): Firestore {
    return this.firestore;
  }

  collection<T>(path: string): CollectionReference<T> {
    return collection(this.firestore, path) as CollectionReference<T>;
  }

  doc<T>(path: string): DocumentReference<T> {
    return doc(this.firestore, path) as DocumentReference<T>;
  }
}
