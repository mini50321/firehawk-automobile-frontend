import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { errorInterceptor } from './error-interceptor';
import { Feedback } from '../services/feedback';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let feedback: { show: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    feedback = { show: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Feedback, useValue: feedback },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("shows the backend's own error message when the response body has one", async () => {
    const promise = firstValueFrom(http.get('/cars/missing')).catch(() => undefined);

    const req = httpMock.expectOne('/cars/missing');
    req.flush(
      { success: false, error: { message: 'Automobile not found: missing' } },
      { status: 404, statusText: 'Not Found' },
    );
    await promise;

    expect(feedback.show).toHaveBeenCalledWith('Automobile not found: missing');
  });

  it('falls back to a generic 404 message when the body has no structured error', async () => {
    const promise = firstValueFrom(http.get('/cars/missing')).catch(() => undefined);

    const req = httpMock.expectOne('/cars/missing');
    req.flush({ unexpected: 'shape' }, { status: 404, statusText: 'Not Found' });
    await promise;

    expect(feedback.show).toHaveBeenCalledWith('The requested resource could not be found.');
  });

  it('shows a network-error message for status 0', async () => {
    const promise = firstValueFrom(http.get('/cars')).catch(() => undefined);

    const req = httpMock.expectOne('/cars');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await promise;

    expect(feedback.show).toHaveBeenCalledWith(
      'Unable to reach the server. Check your connection and try again.',
    );
  });

  it('shows a generic message for a 5xx with no structured error body', async () => {
    const promise = firstValueFrom(http.get('/cars')).catch(() => undefined);

    const req = httpMock.expectOne('/cars');
    req.flush({ unexpected: 'shape' }, { status: 500, statusText: 'Internal Server Error' });
    await promise;

    expect(feedback.show).toHaveBeenCalledWith(
      'Something went wrong on our end. Please try again shortly.',
    );
  });

  it('rethrows the error so callers can still react to it', async () => {
    let caught: unknown;
    const promise = firstValueFrom(http.get('/cars')).catch((error) => {
      caught = error;
    });

    const req = httpMock.expectOne('/cars');
    req.flush({ unexpected: 'shape' }, { status: 500, statusText: 'Internal Server Error' });
    await promise;

    expect(caught).toBeDefined();
  });
});
