import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CarDetailsDialog } from './car-details-dialog';
import { Car } from '../../models/car.model';

const CAR: Car = {
  id: '1',
  make: 'Toyota',
  model: 'Corolla',
  year: 2024,
  vin: '1HGCM82633A004352',
  color: 'Blue',
  mileage: 10000,
  price: 20000,
  status: 'available',
  origin: 'Japan',
  cylinders: 4,
  mpg: 32,
  horsepower: 140,
  weight: 2900,
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

  it('should render the make, model, and year in the title', () => {
    const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(title?.textContent).toContain('Toyota Corolla (2024)');
  });

  it('should render every car field', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('1HGCM82633A004352');
    expect(text).toContain('Blue');
    expect(text).toContain('10,000');
    expect(text).toContain('$20,000.00');
    expect(text).toContain('Available');
    expect(text).toContain('Japan');
    expect(text).toContain('4');
    expect(text).toContain('32');
    expect(text).toContain('140');
    expect(text).toContain('2,900');
  });

  it('should render a close button', () => {
    const closeButton = fixture.nativeElement.querySelector('button[mat-dialog-close]');
    expect(closeButton).toBeTruthy();
    expect(closeButton?.textContent).toContain('Close');
  });
});
