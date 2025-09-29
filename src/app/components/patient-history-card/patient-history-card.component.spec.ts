import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientHistoryCardComponent } from './patient-history-card.component';

describe('PatientHistoryCardComponent', () => {
  let component: PatientHistoryCardComponent;
  let fixture: ComponentFixture<PatientHistoryCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PatientHistoryCardComponent]
    });
    fixture = TestBed.createComponent(PatientHistoryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
