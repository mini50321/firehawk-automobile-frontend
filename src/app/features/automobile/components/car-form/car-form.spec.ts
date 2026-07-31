import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CarForm } from './car-form';
import { AutomobileRepository } from '../../services/automobile-repository';
import { AdminAuth } from '../../../../core/services/admin-auth';
import { Feedback } from '../../../../core/services/feedback';
import { Car } from '../../models/car.model';

const VALID_CAR: Omit<Car, 'id'> = {
  name: 'chevrolet chevelle malibu',
  mpg: 18,
  cylinders: 8,
  displacement: 307,
  horsepower: 130,
  weight: 3504,
  acceleration: 12,
  modelYear: 1970,
  origin: 'usa',
};

describe('CarForm', () => {
  let fixture: ComponentFixture<CarForm>;
  let createCar: ReturnType<typeof vi.fn>;
  let feedbackShow: ReturnType<typeof vi.fn>;
  let adminAuth: AdminAuth;
  let router: Router;

  function setup(): ComponentFixture<CarForm> {
    createCar = vi.fn();
    feedbackShow = vi.fn();

    TestBed.configureTestingModule({
      imports: [CarForm],
      providers: [
        provideRouter([]),
        { provide: AutomobileRepository, useValue: { createCar } },
        { provide: Feedback, useValue: { show: feedbackShow } },
      ],
    });

    adminAuth = TestBed.inject(AdminAuth);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fx = TestBed.createComponent(CarForm);
    fx.detectChanges();
    return fx;
  }

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('when no admin key is stored', () => {
    it('shows the unlock prompt instead of the form', () => {
      fixture = setup();
      const root = fixture.nativeElement as HTMLElement;

      expect(root.querySelector('.car-form-unlock')).toBeTruthy();
      expect(root.querySelector('form.car-form')).toBeFalsy();
    });

    it('unlocking with a key stores it and reveals the form', () => {
      fixture = setup();

      fixture.componentInstance['keyForm'].controls.key.setValue('my-secret');
      fixture.componentInstance['unlock']();
      fixture.detectChanges();

      expect(adminAuth.getKey()).toBe('my-secret');
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('form.car-form')).toBeTruthy();
    });
  });

  describe('when an admin key is already stored', () => {
    beforeEach(() => {
      fixture = setup();
      adminAuth.setKey('existing-key');
      fixture.detectChanges();
    });

    it('shows the form directly', () => {
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('form.car-form')).toBeTruthy();
    });

    it('does not submit an invalid (incomplete) form', () => {
      fixture.componentInstance['submit']();

      expect(createCar).not.toHaveBeenCalled();
      expect(feedbackShow).toHaveBeenCalledWith(
        'Please fix the highlighted fields before submitting.',
      );
    });

    it('submits a valid form with the stored admin key and navigates home on success', () => {
      createCar.mockReturnValue(of({ id: 'new-1', ...VALID_CAR }));
      fixture.componentInstance['form'].patchValue(VALID_CAR);

      fixture.componentInstance['submit']();

      expect(createCar).toHaveBeenCalledWith(VALID_CAR, 'existing-key');
      expect(feedbackShow).toHaveBeenCalledWith('Added "chevrolet chevelle malibu" to the dataset.');
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('clears the stored key and prompts again when the server rejects it (401)', () => {
      createCar.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
      );
      fixture.componentInstance['form'].patchValue(VALID_CAR);

      fixture.componentInstance['submit']();
      fixture.detectChanges();

      expect(adminAuth.getKey()).toBeNull();
      expect(feedbackShow).toHaveBeenCalledWith('That admin key was rejected — please re-enter it.');

      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('.car-form-unlock')).toBeTruthy();
    });
  });
});
