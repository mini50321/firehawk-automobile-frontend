import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Toolbar } from './toolbar';

describe('Toolbar', () => {
  let component: Toolbar;
  let fixture: ComponentFixture<Toolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toolbar],
    }).compileComponents();

    fixture = TestBed.createComponent(Toolbar);
    fixture.componentRef.setInput('title', 'Test Title');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.toolbar-title')?.textContent).toContain('Test Title');
  });

  it('should emit menuToggle when the menu button is clicked', () => {
    const emitSpy = vi.fn();
    component.menuToggle.subscribe(emitSpy);

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
