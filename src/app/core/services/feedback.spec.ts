import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Feedback } from './feedback';

describe('Feedback', () => {
  let service: Feedback;
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: { open: openSpy } }],
    });
    service = TestBed.inject(Feedback);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open a snack bar with the message and a Dismiss action', () => {
    service.show('Filters reset.');

    expect(openSpy).toHaveBeenCalledWith('Filters reset.', 'Dismiss', { duration: 4000 });
  });

  it('should use a custom duration when provided', () => {
    service.show('Exported 5 automobiles.', 2000);

    expect(openSpy).toHaveBeenCalledWith('Exported 5 automobiles.', 'Dismiss', { duration: 2000 });
  });
});
