import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstudianteDetalleDialogComponent } from './estudiante-detalle-dialog.component';

describe('EstudianteDetalleDialogComponent', () => {
  let component: EstudianteDetalleDialogComponent;
  let fixture: ComponentFixture<EstudianteDetalleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EstudianteDetalleDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstudianteDetalleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
