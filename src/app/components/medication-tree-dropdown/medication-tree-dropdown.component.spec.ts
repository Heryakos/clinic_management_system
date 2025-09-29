import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationTreeDropdownComponent } from './medication-tree-dropdown.component';

describe('MedicationTreeDropdownComponent', () => {
  let component: MedicationTreeDropdownComponent;
  let fixture: ComponentFixture<MedicationTreeDropdownComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MedicationTreeDropdownComponent]
    });
    fixture = TestBed.createComponent(MedicationTreeDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
