import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockRequestFormComponent } from './stock-request-form.component';

describe('StockRequestFormComponent', () => {
  let component: StockRequestFormComponent;
  let fixture: ComponentFixture<StockRequestFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StockRequestFormComponent]
    });
    fixture = TestBed.createComponent(StockRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
