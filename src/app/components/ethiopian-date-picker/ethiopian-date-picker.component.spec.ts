import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthiopianDatePickerComponent } from './ethiopian-date-picker.component';

describe('EthiopianDatePickerComponent', () => {
  let component: EthiopianDatePickerComponent;
  let fixture: ComponentFixture<EthiopianDatePickerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EthiopianDatePickerComponent]
    });
    fixture = TestBed.createComponent(EthiopianDatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
