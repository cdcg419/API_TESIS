import { Component, OnInit } from '@angular/core';
import { RegisterNotesService, RendimientoAcademico, EstudianteInfo } from '../../services/register-notes.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-notes',
  standalone: false,
  templateUrl: './register-notes.component.html',
  styleUrl: './register-notes.component.css'
})
export class RegisterNotesComponent {
  estudiantes: EstudianteInfo[] = [];
  alertMessage: string = '';
  alertType: string = ''; // 'success', 'danger', etc.

  notas: RendimientoAcademico = {
    id: 0,
    estudiante_id: 0,
    curso: '',
    trimestre: 0,
    asistencia: 0,
    nota_trimestre: 0,
    conducta: 0
  };

  constructor(
    private notesService: RegisterNotesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const docenteId = Number(localStorage.getItem('userId')); // Asegúrate de que este valor exista
    if (docenteId) {
      this.notesService.obtenerEstudiantesPorDocente(docenteId).subscribe({
        next: (data) => {
          this.estudiantes = data;
        },
        error: (err) => {
          console.error('Error al obtener estudiantes:', err);
        }
      });
    } else {
      console.error('No se encontró el ID del docente en localStorage');
    }
  }
  registrarNotas(): void {
    this.notesService.registrarNotas(this.notas).subscribe({
      next: () => {
        this.alertType = 'success';
        this.alertMessage = 'Nota registrada correctamente.';
      },
      error: (err) => {
        if (err.status === 400 && err.error.detail?.includes('Ya existe una nota')) {
          this.alertType = 'danger';
          this.alertMessage = 'Error: El estudiante ya tiene una nota registrada para este curso y trimestre.';
        } else {
          this.alertType = 'danger';
          this.alertMessage = 'Error al registrar nota. Inténtalo nuevamente.';
        }
        console.error('Error al registrar nota:', err);
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
