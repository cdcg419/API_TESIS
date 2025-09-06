import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { RegisterNotesService, EstudianteInfo} from '../../services/register-notes.service';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { PrediccionService, ResultadoPrediccion } from '../../services/prediccion.service';
@Component({
  selector: 'app-my-students',
  standalone: false,
  templateUrl: './my-students.component.html',
  styleUrl: './my-students.component.css'
})
export class MyStudentsComponent implements OnInit{
  displayedColumns: string[] = ['Codigo del estudiante', 'grado', 'presencia_padres', 'trabaja', 'acciones'];
  dataSource: EstudianteInfo[] = [];
  predicciones: ResultadoPrediccion[] = [];
  alertas: ResultadoPrediccion[] = [];
  estudiantesOriginales: EstudianteInfo[] = [];
  codigoFiltro: string = '';
  gradoFiltro: string = '';
  gradosDisponibles: number[] = [];
  mostrarNotificaciones = false;

  @ViewChild('notiMenu') notiMenu!: ElementRef;
  @ViewChild('notiBtn') notiBtn!: ElementRef;
  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(private registerNotesService: RegisterNotesService, private router: Router,  private studentService: StudentService,private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }

  loadStudents(): void {
    const docenteId = localStorage.getItem('userId');
    if (docenteId) {
      this.registerNotesService.obtenerEstudiantesPorDocente(+docenteId).subscribe({
        next: (data) => {
          this.estudiantesOriginales = data;
          this.dataSource = data;
          this.gradosDisponibles = [...new Set(data.map(e => e.grado))];
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
          console.error('Error al eliminar estudiante. Por favor, intente de nuevo.', err);
          alert('No se pudo eliminar el estudiante');
        }
      });
    }
  }
  /*abrirNotas(estudianteId: number): void {
  this.dialog.open(AcademicRecordsModalComponent, {
    width: '900px',
    maxWidth: 'none', // esto es clave
    data: { estudianteId }
  });
  }*/
  abrirNotas(estudianteId: number): void {
    this.router.navigate(['/notas', estudianteId]);
  }
  obtenerNombreGrado(grado: number): string {
  const nombres = ['Primer grado', 'Segundo grado', 'Tercer grado', 'Cuarto grado', 'Quinto grado', 'Sexto grado'];
  return nombres[grado - 1] || 'Grado desconocido';
  }

  filtrarPorCodigo(valor: string): void {
    this.codigoFiltro = valor.trim().toLowerCase();
    this.aplicarFiltros();
  }

  manejarFiltroCodigo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input?.value ?? '';
    this.filtrarPorCodigo(valor);
  }

  filtrarPorGrado(valor: string): void {
    this.gradoFiltro = valor;
    this.aplicarFiltros();
  }

  manejarFiltroGrado(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const valor = select?.value ?? '';
    this.filtrarPorGrado(valor);
  }

  aplicarFiltros(): void {
    this.dataSource = this.estudiantesOriginales.filter(est => {
      const coincideCodigo = est.Codigo_estudiante.toLowerCase().includes(this.codigoFiltro);
      const coincideGrado = this.gradoFiltro ? est.grado === +this.gradoFiltro : true;
      return coincideCodigo && coincideGrado;
    });
  }

  limpiarFiltros(): void {
    this.codigoFiltro = '';
    this.gradoFiltro = '';
    this.dataSource = [...this.estudiantesOriginales];
  }

}
