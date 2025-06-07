import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RendimientoDetalleComponent } from './rendimiento-detalle.component';

describe('RendimientoDetalleComponent', () => {
  let component: RendimientoDetalleComponent;
  let fixture: ComponentFixture<RendimientoDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RendimientoDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RendimientoDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
