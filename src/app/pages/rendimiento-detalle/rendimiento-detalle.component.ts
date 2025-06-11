import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-rendimiento-detalle',
  standalone: false,
  templateUrl: './rendimiento-detalle.component.html',
  styleUrl: './rendimiento-detalle.component.css'
})
export class RendimientoDetalleComponent {
  constructor(
    public dialogRef: MatDialogRef<RendimientoDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }

}
