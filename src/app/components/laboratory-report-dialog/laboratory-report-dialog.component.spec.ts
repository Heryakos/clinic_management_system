import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaboratoryReportDialogComponent } from './laboratory-report-dialog.component';

describe('LaboratoryReportDialogComponent', () => {
  let component: LaboratoryReportDialogComponent;
  let fixture: ComponentFixture<LaboratoryReportDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LaboratoryReportDialogComponent]
    });
    fixture = TestBed.createComponent(LaboratoryReportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
