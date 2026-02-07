import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryRequestFormComponent } from './inventory-request-form.component';

describe('InventoryRequestFormComponent', () => {
  let component: InventoryRequestFormComponent;
  let fixture: ComponentFixture<InventoryRequestFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InventoryRequestFormComponent]
    });
    fixture = TestBed.createComponent(InventoryRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
