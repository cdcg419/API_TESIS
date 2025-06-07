import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsStudentsComponent } from './reports-students.component';

describe('ReportsStudentsComponent', () => {
  let component: ReportsStudentsComponent;
  let fixture: ComponentFixture<ReportsStudentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportsStudentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
