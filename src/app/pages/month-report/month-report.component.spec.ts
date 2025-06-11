import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthReportComponent } from './month-report.component';

describe('MonthReportComponent', () => {
  let component: MonthReportComponent;
  let fixture: ComponentFixture<MonthReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonthReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
