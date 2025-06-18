import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-estudiante-detalle-dialog',
  standalone: false,
  templateUrl: './estudiante-detalle-dialog.component.html',
  styleUrl: './estudiante-detalle-dialog.component.css'
})
export class EstudianteDetalleDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EstudianteDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }

}
