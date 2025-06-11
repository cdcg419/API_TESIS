import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicRiskReportComponent } from './academic-risk-report.component';

describe('AcademicRiskReportComponent', () => {
  let component: AcademicRiskReportComponent;
  let fixture: ComponentFixture<AcademicRiskReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcademicRiskReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicRiskReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
