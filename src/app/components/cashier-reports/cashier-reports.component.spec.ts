import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierReportsComponent } from './cashier-reports.component';

describe('CashierReportsComponent', () => {
  let component: CashierReportsComponent;
  let fixture: ComponentFixture<CashierReportsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CashierReportsComponent]
    });
    fixture = TestBed.createComponent(CashierReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
