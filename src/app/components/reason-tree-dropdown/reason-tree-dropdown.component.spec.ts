import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonTreeDropdownComponent } from './reason-tree-dropdown.component';

describe('ReasonTreeDropdownComponent', () => {
  let component: ReasonTreeDropdownComponent;
  let fixture: ComponentFixture<ReasonTreeDropdownComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReasonTreeDropdownComponent]
    });
    fixture = TestBed.createComponent(ReasonTreeDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
