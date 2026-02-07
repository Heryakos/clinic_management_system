import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReimbursementDocumentsViewerComponent } from './reimbursement-documents-viewer.component';

describe('ReimbursementDocumentsViewerComponent', () => {
  let component: ReimbursementDocumentsViewerComponent;
  let fixture: ComponentFixture<ReimbursementDocumentsViewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReimbursementDocumentsViewerComponent]
    });
    fixture = TestBed.createComponent(ReimbursementDocumentsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
