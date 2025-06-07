import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-rendimiento-detalle',
  standalone: false,
  templateUrl: './rendimiento-detalle.component.html',
  styleUrl: './rendimiento-detalle.component.css'
})
export class RendimientoDetalleComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
