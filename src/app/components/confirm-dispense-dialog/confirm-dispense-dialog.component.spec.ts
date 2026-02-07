import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDispenseDialogComponent } from './confirm-dispense-dialog.component';

describe('ConfirmDispenseDialogComponent', () => {
  let component: ConfirmDispenseDialogComponent;
  let fixture: ComponentFixture<ConfirmDispenseDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmDispenseDialogComponent]
    });
    fixture = TestBed.createComponent(ConfirmDispenseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
