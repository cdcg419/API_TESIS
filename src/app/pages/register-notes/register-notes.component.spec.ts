import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterNotesComponent } from './register-notes.component';

describe('RegisterNotesComponent', () => {
  let component: RegisterNotesComponent;
  let fixture: ComponentFixture<RegisterNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterNotesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
