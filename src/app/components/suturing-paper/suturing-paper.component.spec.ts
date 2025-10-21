import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuturingPaperComponent } from './suturing-paper.component';

describe('SuturingPaperComponent', () => {
  let component: SuturingPaperComponent;
  let fixture: ComponentFixture<SuturingPaperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SuturingPaperComponent]
    });
    fixture = TestBed.createComponent(SuturingPaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
