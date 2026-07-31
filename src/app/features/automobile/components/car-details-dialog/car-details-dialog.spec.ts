import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CarDetailsDialog } from './car-details-dialog';
import { Car } from '../../models/car.model';

const CAR: Car = {
  id: '1',
  symboling: 0,
  normalizedLosses: 100,
  make: 'toyota',
  fuelType: 'gas',
  aspiration: 'std',
  numOfDoors: 4,
  bodyStyle: 'sedan',
  driveWheels: 'fwd',
  engineLocation: 'front',
  wheelBase: 95,
  length: 170,
  width: 65,
  height: 55,
  curbWeight: 2900,
  engineType: 'ohc',
  numOfCylinders: 4,
  engineSize: 120,
  fuelSystem: 'mpfi',
  bore: 3.2,
  stroke: 3.1,
  compressionRatio: 9.5,
  horsepower: 140,
  peakRpm: 5000,
  cityMpg: 25,
  highwayMpg: 32,
  price: 20000,
};

describe('CarDetailsDialog', () => {
  let fixture: ComponentFixture<CarDetailsDialog>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CarDetailsDialog],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: CAR }],
    });
    fixture = TestBed.createComponent(CarDetailsDialog);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the make and body style in the title', () => {
    const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(title?.textContent).toContain('Toyota');
    expect(title?.textContent).toContain('Sedan');
  });

  it('should render every car field', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('$20,000.00');
    expect(text).toContain('Gas');
    expect(text).toContain('Std');
    expect(text).toContain('FWD');
    expect(text).toContain('Front');
    expect(text).toContain('OHC');
    expect(text).toContain('MPFI');
    expect(text).toContain('120');
    expect(text).toContain('140');
    expect(text).toContain('25 / 32');
    expect(text).toContain('2,900');
    expect(text).toContain('4');
  });

  it('should show "Unknown" for null price and horsepower instead of blank', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CarDetailsDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { ...CAR, price: null, horsepower: null } },
      ],
    });
    const nullFixture = TestBed.createComponent(CarDetailsDialog);
    nullFixture.detectChanges();

    const text = (nullFixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Unknown');
  });

  it('should render a close button', () => {
    const closeButton = fixture.nativeElement.querySelector('button[mat-dialog-close]');
    expect(closeButton).toBeTruthy();
    expect(closeButton?.textContent).toContain('Close');
  });
});
