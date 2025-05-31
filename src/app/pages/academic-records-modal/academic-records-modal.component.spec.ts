import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicRecordsModalComponent } from './academic-records-modal.component';

describe('AcademicRecordsModalComponent', () => {
  let component: AcademicRecordsModalComponent;
  let fixture: ComponentFixture<AcademicRecordsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcademicRecordsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicRecordsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
