import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryAcademicReportComponent } from './history-academic-report.component';

describe('HistoryAcademicReportComponent', () => {
  let component: HistoryAcademicReportComponent;
  let fixture: ComponentFixture<HistoryAcademicReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistoryAcademicReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryAcademicReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
