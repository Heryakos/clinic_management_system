import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientCardComponent } from './patient-card.component';

describe('PatientCardComponent', () => {
  let component: PatientCardComponent;
  let fixture: ComponentFixture<PatientCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PatientCardComponent]
    });
    fixture = TestBed.createComponent(PatientCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
