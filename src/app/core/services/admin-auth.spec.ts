import { TestBed } from '@angular/core/testing';

import { AdminAuth } from './admin-auth';

const STORAGE_KEY = 'firehawk-automobile.admin-key';

describe('AdminAuth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('has no key by default', () => {
    const service = TestBed.inject(AdminAuth);
    expect(service.hasKey()).toBe(false);
    expect(service.getKey()).toBeNull();
  });

  it('restores a previously stored key from sessionStorage', () => {
    sessionStorage.setItem(STORAGE_KEY, 'stored-key');

    const service = TestBed.inject(AdminAuth);

    expect(service.hasKey()).toBe(true);
    expect(service.getKey()).toBe('stored-key');
  });

  it('setKey stores the key and updates hasKey', () => {
    const service = TestBed.inject(AdminAuth);

    service.setKey('new-key');

    expect(service.hasKey()).toBe(true);
    expect(service.getKey()).toBe('new-key');
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('new-key');
  });

  it('clearKey removes the key from state and sessionStorage', () => {
    const service = TestBed.inject(AdminAuth);
    service.setKey('new-key');

    service.clearKey();

    expect(service.hasKey()).toBe(false);
    expect(service.getKey()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
