import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  CollectionReference,
  DocumentData,
  DocumentReference,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Observable, defer, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Firebase {
  private readonly firestore = inject(Firestore);

  getFirestore(): Firestore {
    return this.firestore;
  }

  collection<T = DocumentData>(path: string): CollectionReference<T> {
    return collection(this.firestore, path) as CollectionReference<T>;
  }

  doc<T = DocumentData>(path: string, id: string): DocumentReference<T> {
    return doc(this.firestore, path, id) as DocumentReference<T>;
  }

  /** Real-time stream of every document in the collection, id included. */
  collection$<T>(path: string): Observable<T[]> {
    return collectionData(this.collection(path), { idField: 'id' }) as unknown as Observable<T[]>;
  }

  /** Real-time stream of a single document; emits `undefined` if it does not exist. */
  doc$<T>(path: string, id: string): Observable<T | undefined> {
    return docData(this.doc(path, id), { idField: 'id' }) as unknown as Observable<T | undefined>;
  }

  /** Adds a new document and resolves with its generated id. */
  add<T extends object>(path: string, data: T): Observable<string> {
    return defer(() => from(addDoc(this.collection(path), data).then((ref) => ref.id)));
  }

  /** Merges a partial update into an existing document. */
  update<T extends object>(path: string, id: string, changes: Partial<T>): Observable<void> {
    return defer(() => from(updateDoc(this.doc(path, id), changes as DocumentData)));
  }

  /** Deletes a document. */
  remove(path: string, id: string): Observable<void> {
    return defer(() => from(deleteDoc(this.doc(path, id))));
  }
}
