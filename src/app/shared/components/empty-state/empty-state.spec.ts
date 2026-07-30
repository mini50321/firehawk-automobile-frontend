import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `
    <app-empty-state icon="search_off" title="No results" message="Try again">
      <button type="button">Reset filters</button>
    </app-empty-state>
  `,
})
class HostComponent {}

describe('EmptyState', () => {
  function setup(): ComponentFixture<EmptyState> {
    TestBed.configureTestingModule({ imports: [EmptyState] });
    const fixture = TestBed.createComponent(EmptyState);
    fixture.componentRef.setInput('title', 'No automobiles found');
    return fixture;
  }

  it('should create', () => {
    const fixture = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the given title and default icon', () => {
    const fixture = setup();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.empty-state-title')?.textContent).toContain('No automobiles found');
    expect(root.querySelector('mat-icon')?.textContent?.trim()).toBe('info_outline');
  });

  it('should render a custom icon when provided', () => {
    const fixture = setup();
    fixture.componentRef.setInput('icon', 'directions_car');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('mat-icon')?.textContent?.trim()).toBe('directions_car');
  });

  it('should not render a message paragraph when none is provided', () => {
    const fixture = setup();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.empty-state-message')).toBeNull();
  });

  it('should render the message when provided', () => {
    const fixture = setup();
    fixture.componentRef.setInput('message', 'Try adjusting your filters.');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.empty-state-message')?.textContent).toContain(
      'Try adjusting your filters.',
    );
  });

  it('should project action content into the actions slot', () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.textContent).toContain('Reset filters');
  });
});
