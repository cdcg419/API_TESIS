import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-register-student',
  standalone: false,
  templateUrl: './register-student.component.html',
  styleUrl: './register-student.component.css'
})
export class RegisterStudentComponent {
  student = {
    nombre: '',
    edad: 0,
    genero: '',
    grado: 0,
    presencia_padres: '',
    trabaja: false
  };
  successMessage = '';
  errorMessage = '';

 constructor(private studentService: StudentService, private router: Router) {}

  onSubmit(): void {
    this.studentService.createStudent(this.student).subscribe(
      () => {
        this.successMessage = 'Estudiante registrado exitosamente.';
        this.errorMessage = '';
        this.router.navigate(['/dashboard']); // cambia a la ruta que corresponda
      },
      () => {
        this.errorMessage = 'Error al registrar el estudiante.';
        this.successMessage = '';
      }
    );
  }
}
