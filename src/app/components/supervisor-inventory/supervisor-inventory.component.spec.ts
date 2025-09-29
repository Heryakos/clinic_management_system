import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorInventoryComponent } from './supervisor-inventory.component';

describe('SupervisorInventoryComponent', () => {
  let component: SupervisorInventoryComponent;
  let fixture: ComponentFixture<SupervisorInventoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SupervisorInventoryComponent]
    });
    fixture = TestBed.createComponent(SupervisorInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
