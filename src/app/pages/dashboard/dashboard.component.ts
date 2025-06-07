import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { PrediccionService, ResultadoPrediccion } from '../../services/prediccion.service';
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

  @ViewChild('notiMenu') notiMenu!: ElementRef;
  @ViewChild('notiBtn') notiBtn!: ElementRef;

  constructor(private authService: AuthService, private router: Router, private studentService: StudentService, private prediccionService: PrediccionService ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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
          //p.observacion?.includes('⚠️ Atención: Existen múltiples factores de riesgo que podrían afectar negativamente el rendimiento.')
          ["Medio", "Bajo"].includes(p.rendimiento)
        );
      },
      error: (err) => {
        console.error('Error al obtener predicciones', err);
      }
    });
  }
  toggleNotificaciones(): void {
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
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
