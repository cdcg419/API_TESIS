import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankingReportsComponent } from './ranking-reports.component';

describe('RankingReportsComponent', () => {
  let component: RankingReportsComponent;
  let fixture: ComponentFixture<RankingReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RankingReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RankingReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
