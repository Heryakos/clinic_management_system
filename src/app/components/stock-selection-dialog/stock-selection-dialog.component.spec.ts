import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockSelectionDialogComponent } from './stock-selection-dialog.component';

describe('StockSelectionDialogComponent', () => {
  let component: StockSelectionDialogComponent;
  let fixture: ComponentFixture<StockSelectionDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StockSelectionDialogComponent]
    });
    fixture = TestBed.createComponent(StockSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
