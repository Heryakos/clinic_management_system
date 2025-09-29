import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemReceivingComponent } from './item-receiving.component';

describe('ItemReceivingComponent', () => {
  let component: ItemReceivingComponent;
  let fixture: ComponentFixture<ItemReceivingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ItemReceivingComponent]
    });
    fixture = TestBed.createComponent(ItemReceivingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
