import { TestBed } from '@angular/core/testing';

import { LocalStorage } from './local-storage';

describe('LocalStorage', () => {
  let service: LocalStorage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorage);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null for a key that was never set', () => {
    expect(service.getItem('missing')).toBeNull();
  });

  it('should round-trip a JSON-serializable value', () => {
    service.setItem('key', { a: 1, b: ['x', 'y'] });
    expect(service.getItem('key')).toEqual({ a: 1, b: ['x', 'y'] });
  });

  it('should remove a stored value', () => {
    service.setItem('key', 'value');
    service.removeItem('key');
    expect(service.getItem('key')).toBeNull();
  });

  it('should return null instead of throwing when stored data is corrupted JSON', () => {
    localStorage.setItem('key', '{not valid json');
    expect(service.getItem('key')).toBeNull();
  });

  it('should not throw when the underlying storage write fails', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => service.setItem('key', 'value')).not.toThrow();

    setItemSpy.mockRestore();
  });
});
