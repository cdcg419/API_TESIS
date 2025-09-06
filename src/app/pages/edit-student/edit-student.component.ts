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
  alertMessage: string = '';
  alertType: string = ''; // 'success', 'danger', etc.

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
          this.showAlert('Estudiante actualizado correctamente', 'success');
        setTimeout(() => {
        this.router.navigate(['/my_students']);
        }, 2000);
      },
      error: (err) => {
        if (err.status === 409 || err.error?.detail?.includes('código')) {
          alert('Este código ya está registrado. Intenta con otro.');
        } else {
          this.showAlert('Error al actualizar estudiante', 'danger');
        }
        console.error('Error al actualizar estudiante', err);
      }
    });
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
