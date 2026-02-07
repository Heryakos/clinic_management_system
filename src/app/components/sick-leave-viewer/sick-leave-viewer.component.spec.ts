import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SickLeaveViewerComponent } from './sick-leave-viewer.component';

describe('SickLeaveViewerComponent', () => {
  let component: SickLeaveViewerComponent;
  let fixture: ComponentFixture<SickLeaveViewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SickLeaveViewerComponent]
    });
    fixture = TestBed.createComponent(SickLeaveViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
