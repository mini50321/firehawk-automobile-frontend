import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarStats } from './car-stats';
import { Car } from '../../models/car.model';

function buildCar(overrides: Partial<Car> & Pick<Car, 'id'>): Car {
  return {
    name: 'chevrolet chevelle malibu',
    mpg: 18,
    cylinders: 8,
    displacement: 307,
    horsepower: 130,
    weight: 3504,
    acceleration: 12,
    modelYear: 1970,
    origin: 'usa',
    ...overrides,
  };
}

describe('CarStats', () => {
  let fixture: ComponentFixture<CarStats>;

  function setup(cars: Car[]): ComponentFixture<CarStats> {
    TestBed.configureTestingModule({ imports: [CarStats] });
    const fx = TestBed.createComponent(CarStats);
    fx.componentRef.setInput('cars', cars);
    fx.detectChanges();
    return fx;
  }

  it('should create', () => {
    fixture = setup([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render zeroed stats when there are no cars', () => {
    fixture = setup([]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('0');
    expect(text).toContain('Total Automobiles');
  });

  it('should render the total count and formatted averages', () => {
    const cars = [
      buildCar({ id: '1', mpg: 20, horsepower: 100, weight: 3000 }),
      buildCar({ id: '2', mpg: 25, horsepower: 200, weight: 4000 }),
    ];
    fixture = setup(cars);
    const root = fixture.nativeElement as HTMLElement;
    const values = Array.from(root.querySelectorAll('.car-stats-value')).map(
      (el) => el.textContent?.trim() ?? '',
    );

    expect(values[0]).toBe('2');
    expect(values[1]).toBe('22.5');
    expect(values[2]).toBe('150');
    expect(values[3]).toContain('3,500');
  });

  it('should recompute when the cars input changes', () => {
    fixture = setup([buildCar({ id: '1', mpg: 20 })]);
    fixture.componentRef.setInput('cars', [
      buildCar({ id: '1', mpg: 20 }),
      buildCar({ id: '2', mpg: 40 }),
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const totalValue = root.querySelector('.car-stats-value')?.textContent?.trim();

    expect(totalValue).toBe('2');
  });
});
