import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReimbursementDocumentUploadComponent } from './reimbursement-document-upload.component';

describe('ReimbursementDocumentUploadComponent', () => {
  let component: ReimbursementDocumentUploadComponent;
  let fixture: ComponentFixture<ReimbursementDocumentUploadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReimbursementDocumentUploadComponent]
    });
    fixture = TestBed.createComponent(ReimbursementDocumentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
