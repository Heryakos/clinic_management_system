import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientMedicalHistoryComponent } from './patient-medical-history.component';

describe('PatientMedicalHistoryComponent', () => {
  let component: PatientMedicalHistoryComponent;
  let fixture: ComponentFixture<PatientMedicalHistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PatientMedicalHistoryComponent]
    });
    fixture = TestBed.createComponent(PatientMedicalHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
