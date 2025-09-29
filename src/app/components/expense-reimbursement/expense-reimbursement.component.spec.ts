import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseReimbursementComponent } from './expense-reimbursement.component';

describe('ExpenseReimbursementComponent', () => {
  let component: ExpenseReimbursementComponent;
  let fixture: ComponentFixture<ExpenseReimbursementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExpenseReimbursementComponent]
    });
    fixture = TestBed.createComponent(ExpenseReimbursementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
