import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService, Student } from '../../services/student.service';

@Component({
  selector: 'app-edit-student',
  standalone: false,
  templateUrl: './edit-student.component.html',
  styleUrl: './edit-student.component.css'
})
export class EditStudentComponent implements OnInit {
  student: Student = {
    Codigo_estudiante: '',
    edad: 0,
    grado: 1,
    genero: '',
    presencia_padres: '',
    trabaja: false
  };

  studentId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    // Obtener ID desde la ruta
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));

    // Cargar datos del estudiante
    this.studentService.getStudent(this.studentId).subscribe({
      next: (data) => {
        this.student = data;
      },
      error: (err) => {
        console.error('Error al cargar estudiante', err);
      }
    });
  }

  onSubmit(): void {
    this.studentService.updateStudent(this.studentId, this.student).subscribe({
      next: () => {
        alert('Estudiante actualizado correctamente');
        this.router.navigate(['/my_students']);
      },
      error: (err) => {
        if (err.status === 409 || err.error?.detail?.includes('código')) {
          alert('Este código ya está registrado. Intenta con otro.');
        } else {
          alert('Error al actualizar estudiante');
        }
        console.error('Error al actualizar estudiante', err);
      }
    });
  }
}

