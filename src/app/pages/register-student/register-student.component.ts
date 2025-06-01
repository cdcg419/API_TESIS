import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StudentService, Student } from '../../services/student.service';

@Component({
  selector: 'app-register-student',
  standalone: false,
  templateUrl: './register-student.component.html',
  styleUrl: './register-student.component.css'
})
export class RegisterStudentComponent {
  student: Student = {
    Codigo_estudiante: '',
    edad: 0,
    grado: 0,
    genero: '',
    presencia_padres: '',
    trabaja: false
  };


 constructor(private studentService: StudentService, private router: Router) {}

  register() {
    this.studentService.createStudent(this.student).subscribe({
      next: (data) => {
        alert('Estudiante registrado con éxito');
        this.router.navigate(['/students']); // redirige a la lista de estudiantes
      },
      error: (err) => {
        alert('Error al registrar estudiante');
        console.error(err);
      }
    });
  }
  onSubmit() {
  this.register();
  }
  volverAlDashboard() {
  this.router.navigate(['/dashboard']); // Cambia si tu ruta es distinta
  }
}
