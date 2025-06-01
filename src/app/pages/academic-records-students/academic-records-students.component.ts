import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RegisterNotesService, RendimientoAcademico } from '../../services/register-notes.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-academic-records-students',
  standalone: false,
  templateUrl: './academic-records-students.component.html',
  styleUrl: './academic-records-students.component.css'
})
export class AcademicRecordsStudentsComponent implements OnInit{
displayedColumns: string[] = ['curso', 'trimestre', 'asistencia', 'nota_trimestre', 'conducta', 'acciones'];
  notas: RendimientoAcademico[] = [];
  estudianteId!: number;

  constructor(private route: ActivatedRoute, private notesService: RegisterNotesService) {}

  ngOnInit(): void {
    this.estudianteId = Number(this.route.snapshot.paramMap.get('id'));
    this.notesService.obtenerNotasPorEstudiante(this.estudianteId).subscribe({
      next: (res) => this.notas = res,
      error: (err) => console.error('Error cargando notas', err)
    });
  }

  confirmarEdicion(nota: RendimientoAcademico): void {
    if (confirm('¿Estás seguro de aplicar los cambios?')) {
      this.notesService.actualizarNota(nota.id, nota).subscribe({
        next: () => alert('Cambios aplicados correctamente'),
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

}
