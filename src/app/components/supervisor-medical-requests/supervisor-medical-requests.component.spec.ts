import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorMedicalRequestsComponent } from './supervisor-medical-requests.component';

describe('SupervisorMedicalRequestsComponent', () => {
  let component: SupervisorMedicalRequestsComponent;
  let fixture: ComponentFixture<SupervisorMedicalRequestsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SupervisorMedicalRequestsComponent]
    });
    fixture = TestBed.createComponent(SupervisorMedicalRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
