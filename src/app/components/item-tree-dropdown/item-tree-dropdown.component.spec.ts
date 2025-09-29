import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemTreeDropdownComponent } from './item-tree-dropdown.component';

describe('ItemTreeDropdownComponent', () => {
  let component: ItemTreeDropdownComponent;
  let fixture: ComponentFixture<ItemTreeDropdownComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ItemTreeDropdownComponent]
    });
    fixture = TestBed.createComponent(ItemTreeDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
