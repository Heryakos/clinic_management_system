import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferralTabComponent } from './referral-tab.component';

describe('ReferralTabComponent', () => {
  let component: ReferralTabComponent;
  let fixture: ComponentFixture<ReferralTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReferralTabComponent]
    });
    fixture = TestBed.createComponent(ReferralTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
