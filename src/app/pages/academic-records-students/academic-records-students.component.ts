import { Component, Inject, OnInit } from '@angular/core';
import { RegisterNotesService, RendimientoAcademico } from '../../services/register-notes.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RendimientoDetalleComponent } from '../rendimiento-detalle/rendimiento-detalle.component';


@Component({
  selector: 'app-academic-records-students',
  standalone: false,
  templateUrl: './academic-records-students.component.html',
  styleUrl: './academic-records-students.component.css'
})
export class AcademicRecordsStudentsComponent implements OnInit{
displayedColumns: string[] = ['curso', 'trimestre', 'asistencia', 'nota_trimestre', 'conducta', 'rendimiento', 'acciones'];
  notas: RendimientoAcademico[] = [];
  estudianteId!: number;

  constructor(private route: ActivatedRoute, private notesService: RegisterNotesService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.estudianteId = Number(this.route.snapshot.paramMap.get('id'));
    this.notesService.obtenerNotasPorEstudiante(this.estudianteId).subscribe({
      next: (res) => {
      this.notas = res;

      // Predecir rendimiento automáticamente para cada nota
      this.notas.forEach(nota => {
        this.predecirRendimiento(nota);
      });},
      error: (err) => console.error('Error cargando notas', err)
    });
  }

  confirmarEdicion(nota: RendimientoAcademico): void {
    if (confirm('¿Estás seguro de aplicar los cambios?')) {
      this.notesService.actualizarNota(nota.id, nota).subscribe({
        next: () => {
          alert('Cambios aplicados correctamente')
          this.notas.forEach(nota => {
          this.predecirRendimiento(nota);
          })
        },
        error: err => {
          console.error(err);
          alert('Error al actualizar la nota');
        }
      });
    }
  }

  eliminarNota(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta nota?')) {
      this.notesService.eliminarNota(id).subscribe({
        next: () => {
          alert('Nota eliminada');
          this.notas = this.notas.filter(n => n.id !== id);
        },
        error: err => {
          console.error(err);
          alert('Error al eliminar la nota');
        }
      });
    }
  }

  predecirRendimiento(nota: RendimientoAcademico): void {
  this.notesService.predecirRendimiento(this.estudianteId, nota).subscribe({
    next: (res) => {
      nota.rendimiento = res.rendimiento;
      nota.factores_riesgo = res.factores_riesgo;
      nota.Mensaje_riesgo = res.Mensaje_riesgo;
    },
    error: err => {
      console.error(err);
      alert('Error al predecir rendimiento');
    }
  });
  }
  abrirDetalle(nota: RendimientoAcademico): void {
  this.dialog.open(RendimientoDetalleComponent, {
    data: {
      rendimiento: nota.rendimiento,
      factores_riesgo: nota.factores_riesgo,
      observacion_final: nota.Mensaje_riesgo
    }
  });
  }
  cursos: string[] = [
  'Ciencia y Tecnología',
  'Comunicación',
  'Matemática',
  'Personal Social',
  'Educación Física',
  'Arte y Cultura',
  'Educación Religiosa',
  'Competencias Transversales'
  ];
}
