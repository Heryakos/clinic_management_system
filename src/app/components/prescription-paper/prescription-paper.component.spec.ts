import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionPaperComponent } from './prescription-paper.component';

describe('PrescriptionPaperComponent', () => {
  let component: PrescriptionPaperComponent;
  let fixture: ComponentFixture<PrescriptionPaperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PrescriptionPaperComponent]
    });
    fixture = TestBed.createComponent(PrescriptionPaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
