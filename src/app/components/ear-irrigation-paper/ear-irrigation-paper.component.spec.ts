import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarIrrigationPaperComponent } from './ear-irrigation-paper.component';

describe('EarIrrigationPaperComponent', () => {
  let component: EarIrrigationPaperComponent;
  let fixture: ComponentFixture<EarIrrigationPaperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EarIrrigationPaperComponent]
    });
    fixture = TestBed.createComponent(EarIrrigationPaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
