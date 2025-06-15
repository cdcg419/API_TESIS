import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StudentService, Student } from '../../services/student.service';

@Component({
  selector: 'app-register-student',
  standalone: false,
  templateUrl: './register-student.component.html',
  styleUrl: './register-student.component.css',
})
export class RegisterStudentComponent {
  student: Student = {
    Codigo_estudiante: '',
    edad: 0,
    grado: 0,
    genero: '',
    presencia_padres: '',
    trabaja: false,
  };

  alertMessage: string = '';
  alertType: string = ''; // 'success', 'danger', etc.

  constructor(private studentService: StudentService, private router: Router) {}

  register() {
    this.studentService.createStudent(this.student).subscribe({
      next: (data) => {
        this.showAlert('Estudiante registrado con éxito', 'success');
        setTimeout(() => {
          this.router.navigate(['/students']);
        }, 2000); // redirige después de 2 segundos
      },
      error: (err) => {
        this.showAlert('Error al registrar estudiante', 'danger');
        console.error(err);
      }
    });
  }

  onSubmit() {
    this.register();
  }

  volverAlDashboard() {
    this.router.navigate(['/dashboard']);
  }

  private showAlert(message: string, type: string) {
    this.alertMessage = message;
    this.alertType = type;

    // Auto cerrar después de 5 segundos
    setTimeout(() => {
      this.alertMessage = '';
    }, 5000);
  }
}
