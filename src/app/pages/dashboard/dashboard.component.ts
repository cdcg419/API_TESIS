import { Component, ElementRef, HostListener, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { PrediccionService, ResultadoPrediccion } from '../../services/prediccion.service';
import { DashboardService } from '../../services/dashboard.service';
import { Chart } from 'chart.js/auto';
import { MatSidenav } from '@angular/material/sidenav';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{
  predicciones: ResultadoPrediccion[] = [];
  alertas: ResultadoPrediccion[] = [];
  mostrarNotificaciones = false;
  mostrarDetalle: boolean[] = [];
  getNombreTrimestre(numero: number): string {
    const nombres = ['Primer Trimestre', 'Segundo Trimestre', 'Tercer Trimestre'];
    return nombres[numero - 1] || `Trimestre ${numero}`;
  }

  @ViewChild('notiMenu') notiMenu!: ElementRef;
  @ViewChild('notiBtn') notiBtn!: ElementRef;
  @ViewChild('sidenav') sidenav!: MatSidenav;


  trimestres = [
    { valor: 1, nombre: 'Primer Trimestre' },
    { valor: 2, nombre: 'Segundo Trimestre' },
    { valor: 3, nombre: 'Tercer Trimestre' }
  ];


  totalCursos: number = 0;
  totalEstudiantes: number = 0;
  generoChart: any;
  trabajoChart: any;
  rendimientoChart: any;
  trimestreEstudiantes = 1;
  trimestreRendimiento = 1;
  estudiantesBajoRendimiento: any[] = [];
  gradoRendimiento = 1;
  grados = [
    { valor: 1, nombre: 'Primer Grado' },
    { valor: 2, nombre: 'Segundo Grado' },
    { valor: 3, nombre: 'Tercer Grado' },
    { valor: 4, nombre: 'Cuarto Grado' },
    { valor: 5, nombre: 'Quinto Grado' },
    { valor: 6, nombre: 'Sexto Grado' }
  ];
  mensajeErrorDashboard: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private studentService: StudentService,
    private prediccionService: PrediccionService,
    private dashboardService: DashboardService,
    private http: HttpClient
  ) {}

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al cerrar la sesión:', err);
        alert('Ocurrió un error al cerrar la sesión. Intentando nuevamente...');

        // Reintento automático
        setTimeout(() => {
          this.authService.logout().subscribe({
            next: () => {
              this.router.navigate(['/login']);
            },
            error: (err2) => {
              console.error('Segundo intento fallido:', err2);
              alert('No se pudo cerrar la sesión. Por favor, inténtalo más tarde.');
            }
          });
        }, 2000);
      }
    });
  }
  ngOnInit(): void {
    this.authService.isAuthenticated().subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.router.navigate(['/login']);  // Redirigir al login si no está autenticado
      }
    });
    this.prediccionService.obtenerPredicciones().subscribe({
      next: (res) => {
        this.predicciones = res;
        this.alertas = res.filter(p =>
          ["Medio", "Bajo"].includes(p.rendimiento),
        );
      },
      error: (err) => {
        console.error('Error al obtener predicciones', err);
      }
    });
    this.prediccionService.obtenerPredicciones().subscribe({
      next: (res) => {
        this.predicciones = res;
        this.alertas = res.filter(p => ["Medio", "Bajo"].includes(p.rendimiento));
        this.mostrarDetalle = this.alertas.map(() => false);
        this.mensajeErrorDashboard = ''; // Limpia el mensaje si todo va bien
      },
      error: (err) => {
        console.error('Error al obtener predicciones', err);
        alert('No se pudo cargar la información. Intente nuevamente.') ;
      }
    });
    this.dashboardService.obtenerTotalCursosAsignados().subscribe({
      next: (res) => {
        this.totalCursos = res;
        this.mensajeErrorDashboard = '';
      },
      error: (err) => {
        console.error('Error al obtener cursos asignados:', err);
        this.mensajeErrorDashboard = 'No se pudo cargar la información. Intente nuevamente.';
      }
    });
    this.dashboardService.obtenerTotalEstudiantes().subscribe({
      next: (res) => {
        this.totalEstudiantes = res;
        this.mensajeErrorDashboard = '';
      },
      error: (err) => {
        console.error('Error al obtener total de estudiantes:', err);
        this.mensajeErrorDashboard = 'No se pudo cargar la información. Intente nuevamente.';
      }
    });
    this.dashboardService.obtenerDistribucionGenero().subscribe({
      next: (res) => {
        this.generarGraficoGenero(res);
        this.mensajeErrorDashboard = '';
      },
      error: (err) => {
        console.error('Error al obtener datos de género:', err);
        this.mensajeErrorDashboard = 'No se pudo cargar la información. Intente nuevamente.';
      }
    });
    this.dashboardService.obtenerEstudiantesTrabajan().subscribe({
      next: (res) => {
        this.generarGraficoTrabajo(res);
        this.mensajeErrorDashboard = '';
      },
      error: (err) => {
        console.error('Error al obtener datos de estudiantes trabajadores:', err);
        this.mensajeErrorDashboard = 'No se pudo cargar la información. Intente nuevamente.';
      }
    });
    this.cargarGraficoRendimiento();
    this.cargarEstudiantesBajoRendimiento();
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.sidenav.open(); // 👈 se abre automáticamente
    }, 0);
  }

  cargarEstudiantesBajoRendimiento(): void {
    this.dashboardService.obtenerEstudiantesBajoRendimiento(this.trimestreEstudiantes).subscribe({
      next: (res) => {
        this.estudiantesBajoRendimiento = res.map(e => ({
          ...e,
          trimestre: this.trimestres.find(t => t.valor === e.trimestre)?.nombre || 'Desconocido'
        }));
        this.mensajeErrorDashboard = '';
      },
      error: (err) => {
        console.error('Error al obtener estudiantes con bajo rendimiento:', err);
        this.mensajeErrorDashboard = 'No se pudo cargar la información. Intente nuevamente.';
      }
    });
  }

  cargarGraficoRendimiento(): void {
    this.dashboardService
      .obtenerRendimientoBajo(this.trimestreRendimiento, this.gradoRendimiento)
      .subscribe({
        next: (res) => {
          this.generarGraficoRendimiento(res);
          this.mensajeErrorDashboard = '';
        },
        error: (err) => {
          console.error('Error al obtener datos de rendimiento bajo:', err);
          this.mensajeErrorDashboard = 'No se pudo cargar la información. Intente nuevamente.';
        }
      });
  }

  generarGraficoRendimiento(data: { curso: string; porcentaje: number }[]): void {
    const ctx = document.getElementById('rendimientoChart') as HTMLCanvasElement;

    if (this.rendimientoChart) {
      this.rendimientoChart.destroy(); // Para evitar superposición al cambiar trimestre
    }

    this.rendimientoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.curso),
        datasets: [{
          label: 'Porcentaje de bajo rendimiento',
          data: data.map(d => d.porcentaje),
          backgroundColor: '#FF3D00'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }


  generarGraficoGenero(data: { hombres: number; mujeres: number }): void {
    const ctx = document.getElementById('generoChart') as HTMLCanvasElement;

    if (this.generoChart) {
      this.generoChart.destroy();
    }

    this.generoChart = new Chart(ctx, {
      type: 'pie',
      data: {
        datasets: [{
          data: [data.hombres, data.mujeres],
          backgroundColor: ['green', 'pink']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Permite controlar el tamaño
        layout: { padding: 10 }
      }
    });
  }

  generarGraficoTrabajo(data: { grado: number; porcentaje: number }[]): void {
    const ctx = document.getElementById('trabajoChart') as HTMLCanvasElement;

    this.trabajoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => `Grado ${d.grado}`),
        datasets: [{
          label: 'Porcentaje de estudiantes que trabajan',
          data: data.map(d => d.porcentaje),
          backgroundColor: '#FF9800'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100 }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }


  toggleNotificaciones(): void {
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
  }

  cerrarNotificacion(index: number): void {
    const alerta = this.alertas[index];

    this.http.post('http://127.0.0.1:8000/api/auth/alertas/vista', {
      estudiante_id: alerta.estudiante_id,
      curso: alerta.curso,
      trimestre: alerta.trimestre
    }).subscribe({
      next: () => {
        this.alertas.splice(index, 1); // Elimina la alerta del array
      },
      error: (err) => {
        console.error('Error al registrar alerta vista', err);
      }
    });
  }

  toggleDetalle(index: number): void {
    this.mostrarDetalle[index] = !this.mostrarDetalle[index];
  }

  // Detectar clics fuera del menú de notificaciones
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const notiMenuEl = this.notiMenu?.nativeElement;
    const notiBtnEl = this.notiBtn?.nativeElement;
    if (
      this.mostrarNotificaciones &&
      notiMenuEl &&
      !notiMenuEl.contains(event.target) &&
      !notiBtnEl.contains(event.target)
    ) {
      this.mostrarNotificaciones = false;
    }
  }
}
