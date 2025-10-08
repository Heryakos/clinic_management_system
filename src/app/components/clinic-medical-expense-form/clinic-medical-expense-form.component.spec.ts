import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicMedicalExpenseFormComponent } from './clinic-medical-expense-form.component';

describe('ClinicMedicalExpenseFormComponent', () => {
  let component: ClinicMedicalExpenseFormComponent;
  let fixture: ComponentFixture<ClinicMedicalExpenseFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClinicMedicalExpenseFormComponent]
    });
    fixture = TestBed.createComponent(ClinicMedicalExpenseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
