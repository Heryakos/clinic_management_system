import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InjectionManagementComponent } from './injection-management.component';

describe('InjectionManagementComponent', () => {
  let component: InjectionManagementComponent;
  let fixture: ComponentFixture<InjectionManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InjectionManagementComponent]
    });
    fixture = TestBed.createComponent(InjectionManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
