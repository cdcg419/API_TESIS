import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicRecordsStudentsComponent } from './academic-records-students.component';

describe('AcademicRecordsStudentsComponent', () => {
  let component: AcademicRecordsStudentsComponent;
  let fixture: ComponentFixture<AcademicRecordsStudentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcademicRecordsStudentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicRecordsStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
