import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WoundCarePaperComponent } from './wound-care-paper.component';

describe('WoundCarePaperComponent', () => {
  let component: WoundCarePaperComponent;
  let fixture: ComponentFixture<WoundCarePaperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WoundCarePaperComponent]
    });
    fixture = TestBed.createComponent(WoundCarePaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
