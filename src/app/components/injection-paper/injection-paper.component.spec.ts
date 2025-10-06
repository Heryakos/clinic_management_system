import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InjectionPaperComponent } from './injection-paper.component';

describe('InjectionPaperComponent', () => {
  let component: InjectionPaperComponent;
  let fixture: ComponentFixture<InjectionPaperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InjectionPaperComponent]
    });
    fixture = TestBed.createComponent(InjectionPaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
