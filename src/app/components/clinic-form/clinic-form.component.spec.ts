import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicFormComponent } from './clinic-form.component';

describe('ClinicFormComponent', () => {
  let component: ClinicFormComponent;
  let fixture: ComponentFixture<ClinicFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClinicFormComponent]
    });
    fixture = TestBed.createComponent(ClinicFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
