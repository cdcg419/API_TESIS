import { Component,OnInit } from '@angular/core';
import { RegisterNotesService, EstudianteInfo} from '../../services/register-notes.service';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-my-students',
  standalone: false,
  templateUrl: './my-students.component.html',
  styleUrl: './my-students.component.css'
})
export class MyStudentsComponent implements OnInit{
  displayedColumns: string[] = ['nombre', 'apellido_paterno', 'grado', 'acciones'];
  dataSource: EstudianteInfo[] = [];

  constructor(private registerNotesService: RegisterNotesService, private router: Router,  private studentService: StudentService,) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    const docenteId = localStorage.getItem('userId');
    if (docenteId) {
      this.registerNotesService.obtenerEstudiantesPorDocente(+docenteId).subscribe({
        next: (data) => {
          this.dataSource = data;
        },
        error: (err) => {
          console.error('Error al obtener estudiantes', err);
        }
      });
    }
  }

  editarEstudiante(id: number): void {
  this.router.navigate(['/edit-student', id]);
}

  eliminarEstudiante(id: number): void {
    if (confirm('¿Estás seguro de eliminar este estudiante?')) {
      this.studentService.deleteStudent(id).subscribe({
        next: () => {
          alert('Estudiante eliminado correctamente');
          this.loadStudents(); // recarga la lista
        },
        error: (err) => {
          console.error('Error al eliminar estudiante', err);
          alert('No se pudo eliminar el estudiante');
        }
      });
    }
  }
}
