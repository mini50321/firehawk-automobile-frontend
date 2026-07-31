import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CarDetailsDialog } from './car-details-dialog';
import { Car } from '../../models/car.model';

const CAR: Car = {
  id: '1',
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

  it('should render the car name in the title', () => {
    const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(title?.textContent).toContain('Chevrolet Chevelle Malibu');
  });

  it('should render every car field', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Usa');
    expect(text).toContain('18');
    expect(text).toContain('8');
    expect(text).toContain('307');
    expect(text).toContain('130');
    expect(text).toContain('3,504');
    expect(text).toContain('12');
    expect(text).toContain('1970');
  });

  it('should show "Unknown" for a null horsepower instead of blank', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CarDetailsDialog],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { ...CAR, horsepower: null } }],
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
