import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { Api } from './api';

describe('Api', () => {
  let api: Api;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(Api);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('unwraps the { success, data } envelope on GET', async () => {
    const promise = firstValueFrom(api.get<{ id: string }>('/cars/1'));

    const req = httpMock.expectOne((r) => r.url.endsWith('/cars/1'));
    req.flush({ success: true, data: { id: '1' } });

    expect(await promise).toEqual({ id: '1' });
  });

  it('sends query params on GET', () => {
    api.get('/cars', { fuelType: 'gas', limit: 5 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/cars'));
    expect(req.request.params.get('fuelType')).toBe('gas');
    expect(req.request.params.get('limit')).toBe('5');
    req.flush({ success: true, data: {} });
  });

  it('unwraps the envelope on POST', async () => {
    const promise = firstValueFrom(api.post<{ id: string }>('/cars', { make: 'toyota' }));

    const req = httpMock.expectOne((r) => r.url.endsWith('/cars'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ make: 'toyota' });
    req.flush({ success: true, data: { id: 'new-1' } });

    expect(await promise).toEqual({ id: 'new-1' });
  });

  it('sends custom headers on POST when provided', () => {
    api.post('/cars', { make: 'toyota' }, { headers: { 'X-Admin-Key': 'secret' } }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/cars'));
    expect(req.request.headers.get('X-Admin-Key')).toBe('secret');
    req.flush({ success: true, data: {} });
  });

  it('unwraps the envelope on DELETE', async () => {
    const promise = firstValueFrom(api.delete<null>('/cars/1'));

    const req = httpMock.expectOne((r) => r.url.endsWith('/cars/1') && r.method === 'DELETE');
    req.flush({ success: true, data: null });

    expect(await promise).toBeNull();
  });

  describe('buildUrl', () => {
    it('composes the base URL, path, and query string without making a request', () => {
      const url = api.buildUrl('/cars/export', { fuelType: 'gas', limit: 10 });

      expect(url).toContain('/cars/export?');
      expect(url).toContain('fuelType=gas');
      expect(url).toContain('limit=10');
    });

    it('returns just the URL (no query string) when no params are given', () => {
      const url = api.buildUrl('/cars/export');
      expect(url.endsWith('/cars/export')).toBe(true);
    });
  });
});
