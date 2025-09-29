import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InjectionDetailsDialogComponent } from './injection-details-dialog.component';

describe('InjectionDetailsDialogComponent', () => {
  let component: InjectionDetailsDialogComponent;
  let fixture: ComponentFixture<InjectionDetailsDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InjectionDetailsDialogComponent]
    });
    fixture = TestBed.createComponent(InjectionDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
