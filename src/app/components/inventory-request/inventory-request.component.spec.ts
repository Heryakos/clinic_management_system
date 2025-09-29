import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryRequestComponent } from './inventory-request.component';

describe('InventoryRequestComponent', () => {
  let component: InventoryRequestComponent;
  let fixture: ComponentFixture<InventoryRequestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InventoryRequestComponent]
    });
    fixture = TestBed.createComponent(InventoryRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
